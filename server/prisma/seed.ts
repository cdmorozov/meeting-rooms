import { PrismaClient, type Room } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import argon2 from 'argon2';
import { DateTime } from 'luxon';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const passwordHash = await argon2.hash('password123');

  const alice = await prisma.user.upsert({
    where: { email: 'alice@example.com' },
    update: { emailVerifiedAt: new Date() },
    create: {
      name: 'Alice',
      email: 'alice@example.com',
      passwordHash,
      emailVerifiedAt: new Date(),
    },
  });

  const bob = await prisma.user.upsert({
    where: { email: 'bob@example.com' },
    update: { emailVerifiedAt: new Date() },
    create: {
      name: 'Bob',
      email: 'bob@example.com',
      passwordHash,
      emailVerifiedAt: new Date(),
    },
  });

  const roomData = [
    { name: 'Софія', floor: 1, capacity: 4 },
    { name: 'Дніпро', floor: 1, capacity: 6 },
    { name: 'Либідь', floor: 2, capacity: 8 },
    { name: 'Карпати', floor: 2, capacity: 12 },
    { name: 'Хортиця', floor: 3, capacity: 4 },
    { name: 'Оболонь', floor: 3, capacity: 20 },
  ];

  const rooms: Room[] = [];
  for (const data of roomData) {
    const existing = await prisma.room.findFirst({ where: { name: data.name } });
    rooms.push(existing ?? (await prisma.room.create({ data })));
  }

  const thisMonday = DateTime.now().setZone('Europe/Kyiv').startOf('week');

  const demoBookings = [
    { room: rooms[0], user: alice, title: 'Планування спринту', weeks: 1, day: 0, hour: 10, minute: 0, hours: 1 },
    { room: rooms[1], user: bob, title: 'Зустріч один на один', weeks: 1, day: 1, hour: 14, minute: 0, hours: 1 },
    { room: rooms[2], user: alice, title: 'Огляд макетів', weeks: 1, day: 2, hour: 11, minute: 0, hours: 1 },
    { room: rooms[0], user: alice, title: 'Ретроспектива', weeks: -1, day: 3, hour: 16, minute: 0, hours: 1 },
    { room: rooms[3], user: bob, title: 'Демо для замовника', weeks: -1, day: 4, hour: 15, minute: 0, hours: 1 },

    // ланцюжок впритул в одній кімнаті: кінець одного = початок наступного
    { room: rooms[1], user: alice, title: 'Щоденний синк', weeks: 1, day: 0, hour: 9, minute: 0, hours: 0.5 },
    { room: rooms[1], user: bob, title: 'Інтервʼю кандидата', weeks: 1, day: 0, hour: 9, minute: 30, hours: 1.5 },
    { room: rooms[1], user: alice, title: 'Дзвінок із замовником', weeks: 1, day: 0, hour: 11, minute: 0, hours: 1 },

    { room: rooms[4], user: bob, title: 'Воркшоп по метриках', weeks: 1, day: 3, hour: 13, minute: 0, hours: 2 },
    { room: rooms[5], user: alice, title: 'Загальні збори', weeks: 1, day: 4, hour: 17, minute: 30, hours: 1 },

    { room: rooms[2], user: bob, title: 'Технічне інтервʼю', weeks: 0, day: 1, hour: 12, minute: 30, hours: 1.5 },
    { room: rooms[0], user: alice, title: 'Грумінг беклогу', weeks: 0, day: 3, hour: 10, minute: 0, hours: 1 },
    { room: rooms[3], user: bob, title: 'Синк із дизайном', weeks: 0, day: 3, hour: 11, minute: 0, hours: 0.5 },

    { room: rooms[5], user: bob, title: 'Онбординг новачків', weeks: -1, day: 1, hour: 9, minute: 30, hours: 2 },
    { room: rooms[4], user: alice, title: 'Розбір інциденту', weeks: -1, day: 2, hour: 18, minute: 0, hours: 1 },
  ];

  for (const booking of demoBookings) {
    const startAt = thisMonday
      .plus({ weeks: booking.weeks, days: booking.day })
      .set({ hour: booking.hour, minute: booking.minute });
    const existing = await prisma.booking.findFirst({
      where: { roomId: booking.room.id, startAt: startAt.toJSDate() },
    });
    if (existing) continue;
    await prisma.booking.create({
      data: {
        title: booking.title,
        startAt: startAt.toJSDate(),
        endAt: startAt.plus({ hours: booking.hours }).toJSDate(),
        roomId: booking.room.id,
        userId: booking.user.id,
      },
    });
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
