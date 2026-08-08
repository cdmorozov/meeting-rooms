import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { DateTime } from 'luxon';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/configure-app';
import { PrismaService } from '../src/prisma.service';

const PASSWORD = 'password123';
const OFFICE_ZONE = 'Europe/Kyiv';

function futureSlot(hour: number, dayOffset = 0) {
  const start = DateTime.now()
    .setZone(OFFICE_ZONE)
    .startOf('week')
    .plus({ weeks: 4, days: dayOffset })
    .set({ hour, minute: 0, second: 0, millisecond: 0 });

  return {
    start,
    startAt: start.toUTC().toISO(),
    hourLater: start.plus({ hours: 1 }).toUTC().toISO(),
  };
}

describe('Bookings API', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let roomId: string;
  let notifyRoomId: string;
  let quietRoomId: string;
  let ownerCookie: string;
  let strangerCookie: string;
  const createdEmails: string[] = [];

  async function registerUser(): Promise<{ cookie: string; email: string }> {
    const email = `e2e-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;
    createdEmails.push(email);

    const response = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ name: 'E2E', email, password: PASSWORD })
      .expect(201);

    return { cookie: response.headers['set-cookie'][0], email };
  }

  async function verifyEmail(email: string): Promise<void> {
    const user = await prisma.user.findUniqueOrThrow({
      where: { email },
      select: { verificationToken: true },
    });

    await request(app.getHttpServer())
      .post('/api/auth/verify')
      .send({ token: user.verificationToken })
      .expect(201);
  }

  async function registerVerifiedUser(): Promise<string> {
    const user = await registerUser();
    await verifyEmail(user.email);
    return user.cookie;
  }

  async function ownerId(): Promise<string> {
    const owner = await prisma.user.findUniqueOrThrow({
      where: { email: createdEmails[0] },
      select: { id: true },
    });
    return owner.id;
  }

  async function findBookingId(title: string): Promise<string> {
    const booking = await prisma.booking.findFirstOrThrow({ where: { title } });
    return booking.id;
  }

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();

    prisma = app.get(PrismaService);
    const room = await prisma.room.findFirst({ orderBy: { name: 'asc' } });
    if (!room) {
      throw new Error('Сід не застосовано: у базі немає кімнат');
    }
    roomId = room.id;

    const rooms = await prisma.room.findMany({
      orderBy: { name: 'asc' },
      take: 3,
    });
    notifyRoomId = rooms[1].id;
    quietRoomId = rooms[2].id;

    ownerCookie = await registerVerifiedUser();
    strangerCookie = await registerVerifiedUser();
  });

  afterAll(async () => {
    const users = await prisma.user.findMany({
      where: { email: { in: createdEmails } },
      select: { id: true },
    });
    const userIds = users.map((user) => user.id);

    await prisma.booking.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.session.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.user.deleteMany({ where: { id: { in: userIds } } });
    await app.close();
  });

  it('створює бронювання', async () => {
    const slot = futureSlot(10);

    const response = await request(app.getHttpServer())
      .post(`/api/rooms/${roomId}/bookings`)
      .set('Cookie', ownerCookie)
      .send({ title: 'Планерка', startAt: slot.startAt, endAt: slot.hourLater })
      .expect(201);

    expect(response.body).toMatchObject({ title: 'Планерка' });
  });

  it('не дає забронювати зайнятий слот', async () => {
    const slot = futureSlot(12);

    await request(app.getHttpServer())
      .post(`/api/rooms/${roomId}/bookings`)
      .set('Cookie', ownerCookie)
      .send({ title: 'Перше', startAt: slot.startAt, endAt: slot.hourLater })
      .expect(201);

    const response = await request(app.getHttpServer())
      .post(`/api/rooms/${roomId}/bookings`)
      .set('Cookie', strangerCookie)
      .send({ title: 'Друге', startAt: slot.startAt, endAt: slot.hourLater })
      .expect(409);

    expect(response.body).toMatchObject({
      errors: { general: 'Цей час вже зайнято' },
    });
  });

  it('дозволяє бронювання впритул', async () => {
    const slot = futureSlot(14);

    await request(app.getHttpServer())
      .post(`/api/rooms/${roomId}/bookings`)
      .set('Cookie', ownerCookie)
      .send({ title: 'До', startAt: slot.startAt, endAt: slot.hourLater })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/api/rooms/${roomId}/bookings`)
      .set('Cookie', ownerCookie)
      .send({
        title: 'Після',
        startAt: slot.hourLater,
        endAt: slot.start.plus({ hours: 2 }).toUTC().toISO(),
      })
      .expect(201);
  });

  it('відхиляє час поза робочими годинами', async () => {
    const slot = futureSlot(20);

    const response = await request(app.getHttpServer())
      .post(`/api/rooms/${roomId}/bookings`)
      .set('Cookie', ownerCookie)
      .send({ title: 'Пізно', startAt: slot.startAt, endAt: slot.hourLater })
      .expect(400);

    expect(response.body).toMatchObject({
      errors: {
        general: 'Бронювання можливе лише з 09:00 до 19:00 за київським часом',
      },
    });
  });

  it('відхиляє бронювання довше за 4 години', async () => {
    const slot = futureSlot(9, 1);

    const response = await request(app.getHttpServer())
      .post(`/api/rooms/${roomId}/bookings`)
      .set('Cookie', ownerCookie)
      .send({
        title: 'Довге',
        startAt: slot.startAt,
        endAt: slot.start.plus({ hours: 5 }).toUTC().toISO(),
      })
      .expect(400);

    expect(response.body).toMatchObject({
      errors: { general: 'Максимальна тривалість 4 години' },
    });
  });

  it('відхиляє порожню назву', async () => {
    const slot = futureSlot(11, 2);

    const response = await request(app.getHttpServer())
      .post(`/api/rooms/${roomId}/bookings`)
      .set('Cookie', ownerCookie)
      .send({ title: '   ', startAt: slot.startAt, endAt: slot.hourLater })
      .expect(400);

    expect(response.body).toMatchObject({
      errors: { title: 'Назва має бути від 1 до 100 символів' },
    });
  });

  it('скасовує власне бронювання', async () => {
    const slot = futureSlot(15, 2);

    await request(app.getHttpServer())
      .post(`/api/rooms/${roomId}/bookings`)
      .set('Cookie', ownerCookie)
      .send({
        title: 'На скасування',
        startAt: slot.startAt,
        endAt: slot.hourLater,
      })
      .expect(201);

    const bookingId = await findBookingId('На скасування');

    await request(app.getHttpServer())
      .post(`/api/bookings/${bookingId}/cancel`)
      .set('Cookie', ownerCookie)
      .expect(201);

    const week = slot.start.startOf('week').toFormat('yyyy-MM-dd');
    const schedule = await request(app.getHttpServer())
      .get(`/api/rooms/${roomId}/bookings?weekStart=${week}`)
      .set('Cookie', ownerCookie)
      .expect(200);

    expect(schedule.body).not.toContainEqual(
      expect.objectContaining({ id: bookingId }),
    );
  });

  it('не дає скасувати чуже бронювання', async () => {
    const slot = futureSlot(16, 3);

    await request(app.getHttpServer())
      .post(`/api/rooms/${roomId}/bookings`)
      .set('Cookie', ownerCookie)
      .send({ title: 'Чуже', startAt: slot.startAt, endAt: slot.hourLater })
      .expect(201);

    const bookingId = await findBookingId('Чуже');

    const response = await request(app.getHttpServer())
      .post(`/api/bookings/${bookingId}/cancel`)
      .set('Cookie', strangerCookie)
      .expect(403);

    expect(response.body).toMatchObject({
      errors: { general: 'Це не ваше бронювання' },
    });
  });

  it('не дає бронювати без підтвердженого email', async () => {
    const unconfirmed = await registerUser();
    const slot = futureSlot(9, 4);

    const response = await request(app.getHttpServer())
      .post(`/api/rooms/${roomId}/bookings`)
      .set('Cookie', unconfirmed.cookie)
      .send({
        title: 'Без підтвердження',
        startAt: slot.startAt,
        endAt: slot.hourLater,
      })
      .expect(403);

    expect(response.body).toMatchObject({
      errors: {
        general: 'Підтвердіть email, щоб бронювати',
      },
    });
  });

  it('відхиляє використане посилання підтвердження', async () => {
    const user = await registerUser();
    const created = await prisma.user.findUniqueOrThrow({
      where: { email: user.email },
      select: { verificationToken: true },
    });
    const token = created.verificationToken;

    await verifyEmail(user.email);

    const response = await request(app.getHttpServer())
      .post('/api/auth/verify')
      .send({ token })
      .expect(400);

    expect(response.body).toMatchObject({
      errors: { general: 'Посилання недійсне або вже використане' },
    });
  });

  it('сповіщає про кінець бронювання рівно один раз', async () => {
    const boundary = DateTime.now().plus({ minutes: 5 }).startOf('second');

    await prisma.booking.create({
      data: {
        title: 'Поточна',
        roomId: notifyRoomId,
        userId: await ownerId(),
        startAt: boundary.minus({ hours: 1 }).toJSDate(),
        endAt: boundary.toJSDate(),
      },
    });
    await prisma.booking.create({
      data: {
        title: 'Наступна',
        roomId: notifyRoomId,
        userId: await ownerId(),
        startAt: boundary.toJSDate(),
        endAt: boundary.plus({ hours: 1 }).toJSDate(),
      },
    });

    const first = await request(app.getHttpServer())
      .get('/api/bookings/notifications')
      .set('Cookie', ownerCookie)
      .expect(200);

    expect(first.body).toContainEqual(
      expect.objectContaining({ title: 'Поточна' }),
    );

    const second = await request(app.getHttpServer())
      .get('/api/bookings/notifications')
      .set('Cookie', ownerCookie)
      .expect(200);

    expect(second.body).toEqual([]);
  });

  it('не сповіщає, якщо наступний слот вільний', async () => {
    const boundary = DateTime.now().plus({ minutes: 5 }).startOf('second');

    await prisma.booking.create({
      data: {
        title: 'Без сусіда',
        roomId: quietRoomId,
        userId: await ownerId(),
        startAt: boundary.minus({ hours: 1 }).toJSDate(),
        endAt: boundary.toJSDate(),
      },
    });

    const response = await request(app.getHttpServer())
      .get('/api/bookings/notifications')
      .set('Cookie', ownerCookie)
      .expect(200);

    expect(response.body).toEqual([]);
  });

  it('вимагає авторизації', async () => {
    await request(app.getHttpServer())
      .get('/api/bookings/my?scope=upcoming')
      .expect(401);
  });
});
