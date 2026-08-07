import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class BookingService {
  constructor(private readonly prisma: PrismaService) {}

  async cancel(bookingId: string, userId: string) {
    const booking = await this.prisma.booking.findUnique({ where: { id: bookingId } });
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
