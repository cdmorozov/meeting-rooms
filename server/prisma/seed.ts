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
    update: {},
    create: { name: 'Alice', email: 'alice@example.com', passwordHash },
  });

  const bob = await prisma.user.upsert({
    where: { email: 'bob@example.com' },
    update: {},
    create: { name: 'Bob', email: 'bob@example.com', passwordHash },
  });

  const roomData = [
    { name: 'Mercury', floor: 1, capacity: 4 },
    { name: 'Venus', floor: 1, capacity: 6 },
    { name: 'Earth', floor: 2, capacity: 8 },
    { name: 'Jupiter', floor: 2, capacity: 12 },
    { name: 'Saturn', floor: 3, capacity: 4 },
    { name: 'Neptune', floor: 3, capacity: 20 },
  ];

  const rooms: Room[] = [];
  for (const data of roomData) {
    const existing = await prisma.room.findFirst({ where: { name: data.name } });
    rooms.push(existing ?? (await prisma.room.create({ data })));
  }

  const kyivNow = DateTime.now().setZone('Europe/Kyiv');
  const nextMonday = kyivNow.plus({ weeks: 1 }).startOf('week');

  const demoBookings = [
    { room: rooms[0], user: alice, title: 'Sprint planning', hour: 10 },
    { room: rooms[1], user: bob, title: '1:1', hour: 14 },
    { room: rooms[2], user: alice, title: 'Design review', hour: 11 },
  ];

  for (const booking of demoBookings) {
    const startAt = nextMonday.set({ hour: booking.hour, minute: 0 });
    const existing = await prisma.booking.findFirst({
      where: { roomId: booking.room.id, startAt: startAt.toJSDate() },
    });
    if (existing) continue;
    await prisma.booking.create({
      data: {
        title: booking.title,
        startAt: startAt.toJSDate(),
        endAt: startAt.plus({ hours: 1 }).toJSDate(),
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
