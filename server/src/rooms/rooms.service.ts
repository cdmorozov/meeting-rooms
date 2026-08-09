import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { DateTime } from 'luxon';
import { intervalsOverlap } from '../booking/overlap';
import {
  BookingTimeError,
  OFFICE_ZONE,
  validateBookingTime,
} from '../booking/validate-booking-time';
import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../prisma.service';
import { CreateBookingDto } from './dto/create-booking.dto';

const BOOKING_TIME_ERROR_MESSAGES: Record<BookingTimeError, string> = {
  NOT_MULTIPLE_OF_30: 'Час має бути кратним 30 хвилинам',
  TOO_SHORT: 'Мінімальна тривалість 30 хвилин',
  TOO_LONG: 'Максимальна тривалість 4 години',
  IN_PAST: 'Час бронювання вже минув',
  OUTSIDE_WORKING_HOURS:
    'Бронювання можливе лише з 09:00 до 19:00 за київським часом',
};

const SLOT_TAKEN_MESSAGE = 'Цей час вже зайнято';

const EMAIL_NOT_VERIFIED_MESSAGE = 'Підтвердіть email, щоб бронювати';

const POSTGRES_EXCLUSION_VIOLATION = '23P01';

interface DriverErrorMeta {
  driverAdapterError?: { cause?: { originalCode?: string } };
}

interface Occurrence {
  startAt: Date;
  endAt: Date;
}

// повторення рахуються у київському поясі, щоб після переходу на літній час
// зустріч лишалась о тій самій годині
function weeklyOccurrences(
  startAt: Date,
  endAt: Date,
  count: number,
): Occurrence[] {
  const firstStart = DateTime.fromJSDate(startAt).setZone(OFFICE_ZONE);
  const firstEnd = DateTime.fromJSDate(endAt).setZone(OFFICE_ZONE);

  const occurrences: Occurrence[] = [];
  for (let week = 0; week < count; week += 1) {
    occurrences.push({
      startAt: firstStart.plus({ weeks: week }).toJSDate(),
      endAt: firstEnd.plus({ weeks: week }).toJSDate(),
    });
  }
  return occurrences;
}

// у серії важливо показати, на якому саме тижні проблема
function withDate(
  message: string,
  occurrence: Occurrence,
  isSeries: boolean,
): string {
  if (!isSeries) {
    return message;
  }
  const day = DateTime.fromJSDate(occurrence.startAt)
    .setZone(OFFICE_ZONE)
    .setLocale('uk')
    .toFormat('d MMMM');
  return `${message} (${day})`;
}

function isExclusionViolation(error: unknown): boolean {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError)) {
    return false;
  }
  const meta: DriverErrorMeta | undefined = error.meta;
  return (
    meta?.driverAdapterError?.cause?.originalCode ===
    POSTGRES_EXCLUSION_VIOLATION
  );
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

    const start = DateTime.fromISO(weekStart, { zone: OFFICE_ZONE }).startOf(
      'day',
    );
    const end = start.plus({ weeks: 1 });

    const bookings = await this.prisma.booking.findMany({
      where: {
        roomId,
        cancelledAt: null,
        startAt: { lt: end.toJSDate() },
        endAt: { gt: start.toJSDate() },
      },
      select: {
        id: true,
        title: true,
        startAt: true,
        endAt: true,
        userId: true,
        seriesId: true,
        user: { select: { name: true } },
      },
      orderBy: { startAt: 'asc' },
    });

    return bookings.map((booking) => ({
      id: booking.id,
      title: booking.title,
      startAt: booking.startAt,
      endAt: booking.endAt,
      userId: booking.userId,
      userName: booking.user.name,
      seriesId: booking.seriesId,
    }));
  }

  async createBooking(roomId: string, userId: string, dto: CreateBookingDto) {
    const author = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { emailVerifiedAt: true },
    });
    if (!author?.emailVerifiedAt) {
      throw new ForbiddenException({
        errors: { general: EMAIL_NOT_VERIFIED_MESSAGE },
      });
    }

    const room = await this.prisma.room.findUnique({ where: { id: roomId } });
    if (!room) {
      throw new NotFoundException('Кімнату не знайдено');
    }

    const occurrences = weeklyOccurrences(
      new Date(dto.startAt),
      new Date(dto.endAt),
      dto.repeatCount ?? 1,
    );
    const isSeries = occurrences.length > 1;

    const now = new Date();
    for (const occurrence of occurrences) {
      const timeError = validateBookingTime(
        occurrence.startAt,
        occurrence.endAt,
        now,
      );
      if (timeError) {
        throw new BadRequestException({
          errors: {
            general: withDate(
              BOOKING_TIME_ERROR_MESSAGES[timeError],
              occurrence,
              isSeries,
            ),
          },
        });
      }

      if (await this.isSlotTaken(roomId, occurrence)) {
        throw new ConflictException({
          errors: {
            general: withDate(SLOT_TAKEN_MESSAGE, occurrence, isSeries),
          },
        });
      }
    }

    const seriesId = isSeries ? randomUUID() : null;

    try {
      const created = await this.prisma.$transaction(
        occurrences.map((occurrence) =>
          this.prisma.booking.create({
            data: {
              roomId,
              userId,
              title: dto.title,
              seriesId,
              startAt: occurrence.startAt,
              endAt: occurrence.endAt,
            },
          }),
        ),
      );
      return created[0];
    } catch (error) {
      if (isExclusionViolation(error)) {
        throw new ConflictException({
          errors: { general: SLOT_TAKEN_MESSAGE },
        });
      }
      throw error;
    }
  }

  private async isSlotTaken(
    roomId: string,
    occurrence: Occurrence,
  ): Promise<boolean> {
    const dayStart = DateTime.fromJSDate(occurrence.startAt)
      .setZone(OFFICE_ZONE)
      .startOf('day');

    const sameDayBookings = await this.prisma.booking.findMany({
      where: {
        roomId,
        cancelledAt: null,
        startAt: {
          gte: dayStart.toJSDate(),
          lt: dayStart.plus({ days: 1 }).toJSDate(),
        },
      },
      select: { startAt: true, endAt: true },
    });

    return sameDayBookings.some((booking) =>
      intervalsOverlap(
        occurrence.startAt,
        occurrence.endAt,
        booking.startAt,
        booking.endAt,
      ),
    );
  }
}
