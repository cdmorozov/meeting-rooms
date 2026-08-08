import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { MyBookingsQueryDto } from './dto/my-bookings-query.dto';

const PAST_PAGE_SIZE = 20;

const DEFAULT_NOTIFY_BEFORE_MINUTES = 10;

function notifyBeforeMinutes(): number {
  const configured = Number(process.env.NOTIFY_BEFORE_MINUTES);
  if (!Number.isFinite(configured) || configured <= 0) {
    return DEFAULT_NOTIFY_BEFORE_MINUTES;
  }
  return configured;
}

const BOOKING_LIST_SELECT = {
  id: true,
  title: true,
  startAt: true,
  endAt: true,
  roomId: true,
  room: { select: { name: true } },
};

interface EndingBooking {
  id: string;
  title: string;
  endAt: Date;
  roomId: string;
  room: { name: string };
}

interface BookingWithRoom {
  id: string;
  title: string;
  startAt: Date;
  endAt: Date;
  roomId: string;
  room: { name: string };
}

function toListItem(booking: BookingWithRoom) {
  return {
    id: booking.id,
    title: booking.title,
    startAt: booking.startAt,
    endAt: booking.endAt,
    roomId: booking.roomId,
    roomName: booking.room.name,
  };
}

@Injectable()
export class BookingService {
  constructor(private readonly prisma: PrismaService) {}

  async takeEndingSoonNotifications(userId: string) {
    const now = new Date();
    const until = new Date(now.getTime() + notifyBeforeMinutes() * 60 * 1000);

    const endingSoon = await this.prisma.booking.findMany({
      where: {
        userId,
        cancelledAt: null,
        notifiedAt: null,
        endAt: { gt: now, lte: until },
      },
      select: {
        id: true,
        title: true,
        endAt: true,
        roomId: true,
        room: { select: { name: true } },
      },
      orderBy: { endAt: 'asc' },
    });

    const withBusyNextSlot: EndingBooking[] = [];
    for (const booking of endingSoon) {
      const nextBooking = await this.prisma.booking.findFirst({
        where: {
          roomId: booking.roomId,
          cancelledAt: null,
          startAt: booking.endAt,
        },
        select: { id: true },
      });
      if (nextBooking) {
        withBusyNextSlot.push(booking);
      }
    }

    await this.prisma.booking.updateMany({
      where: { id: { in: withBusyNextSlot.map((booking) => booking.id) } },
      data: { notifiedAt: now },
    });

    return withBusyNextSlot.map((booking) => ({
      id: booking.id,
      title: booking.title,
      endAt: booking.endAt,
      roomName: booking.room.name,
    }));
  }

  async findMine(userId: string, query: MyBookingsQueryDto) {
    const now = new Date();

    if (query.scope === 'upcoming') {
      const bookings = await this.prisma.booking.findMany({
        where: { userId, cancelledAt: null, endAt: { gte: now } },
        orderBy: { startAt: 'asc' },
        select: BOOKING_LIST_SELECT,
      });
      return { items: bookings.map(toListItem), nextCursor: null };
    }

    const bookings = await this.prisma.booking.findMany({
      where: { userId, cancelledAt: null, endAt: { lt: now } },
      orderBy: [{ startAt: 'desc' }, { id: 'desc' }],
      take: PAST_PAGE_SIZE + 1,
      cursor: query.cursor ? { id: query.cursor } : undefined,
      skip: query.cursor ? 1 : 0,
      select: BOOKING_LIST_SELECT,
    });

    const hasMore = bookings.length > PAST_PAGE_SIZE;
    const page = bookings.slice(0, PAST_PAGE_SIZE);
    const lastBooking = page[page.length - 1];

    return {
      items: page.map(toListItem),
      nextCursor: hasMore ? lastBooking.id : null,
    };
  }

  async cancel(bookingId: string, userId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
    });
    if (!booking || booking.cancelledAt) {
      throw new NotFoundException('Бронювання не знайдено');
    }
    if (booking.userId !== userId) {
      throw new ForbiddenException('Це не ваше бронювання');
    }

    return this.prisma.booking.update({
      where: { id: bookingId },
      data: { cancelledAt: new Date() },
    });
  }
}
