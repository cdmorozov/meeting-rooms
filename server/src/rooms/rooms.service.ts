import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { intervalsOverlap } from '../booking/overlap';
import { BookingTimeError, validateBookingTime } from '../booking/validate-booking-time';
import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../prisma.service';
import { CreateBookingDto } from './dto/create-booking.dto';

const BOOKING_TIME_ERROR_MESSAGES: Record<BookingTimeError, string> = {
  NOT_MULTIPLE_OF_30: 'Час має бути кратним 30 хвилинам',
  TOO_SHORT: 'Мінімальна тривалість — 30 хвилин',
  TOO_LONG: 'Максимальна тривалість — 4 години',
  IN_PAST: 'Час бронювання вже минув',
  OUTSIDE_WORKING_HOURS: 'Бронювання можливе лише з 9:00 до 19:00',
};

const SLOT_TAKEN_MESSAGE = 'Цей час вже зайнято';

function isExclusionViolation(error: unknown): boolean {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError)) {
    return false;
  }
  const meta = error.meta as { driverAdapterError?: { cause?: { originalCode?: string } } } | undefined;
  return meta?.driverAdapterError?.cause?.originalCode === '23P01';
}

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

  async createBooking(roomId: string, userId: string, dto: CreateBookingDto) {
    const room = await this.prisma.room.findUnique({ where: { id: roomId } });
    if (!room) {
      throw new NotFoundException('Кімнату не знайдено');
    }

    const startAt = new Date(dto.startAt);
    const endAt = new Date(dto.endAt);

    const timeError = validateBookingTime(startAt, endAt, new Date());
    if (timeError) {
      throw new BadRequestException({ errors: { general: BOOKING_TIME_ERROR_MESSAGES[timeError] } });
    }

    const activeBookings = await this.prisma.booking.findMany({
      where: { roomId, cancelledAt: null },
      select: { startAt: true, endAt: true },
    });
    const hasOverlap = activeBookings.some((booking) => intervalsOverlap(startAt, endAt, booking.startAt, booking.endAt));
    if (hasOverlap) {
      throw new ConflictException({ errors: { general: SLOT_TAKEN_MESSAGE } });
    }

    try {
      return await this.prisma.booking.create({
        data: { roomId, userId, title: dto.title, startAt, endAt },
      });
    } catch (error) {
      if (isExclusionViolation(error)) {
        throw new ConflictException({ errors: { general: SLOT_TAKEN_MESSAGE } });
      }
      throw error;
    }
  }
}
