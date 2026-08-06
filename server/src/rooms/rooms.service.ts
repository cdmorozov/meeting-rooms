import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class RoomsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.room.findMany({ orderBy: { name: 'asc' } });
  }

  async findWeekBookings(roomId: string, weekStart: string) {
    const room = await this.prisma.room.findUnique({ where: { id: roomId } });
    if (!room) {
      throw new NotFoundException('Кімнату не знайдено');
    }

    const start = new Date(`${weekStart}T00:00:00.000Z`);
    const end = new Date(start);
    end.setUTCDate(end.getUTCDate() + 7);

    const bookings = await this.prisma.booking.findMany({
      where: {
        roomId,
        cancelledAt: null,
        startAt: { lt: end },
        endAt: { gt: start },
      },
      select: {
        id: true,
        title: true,
        startAt: true,
        endAt: true,
        userId: true,
        user: { select: { name: true } },
      },
      orderBy: { startAt: 'asc' },
    });

    return bookings.map(({ user, ...booking }) => ({ ...booking, userName: user.name }));
  }
}
