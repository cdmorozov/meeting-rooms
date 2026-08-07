import { Controller, Param, ParseUUIDPipe, Post, Req, UnauthorizedException, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { SessionGuard } from '../auth/session.guard';
import { BookingService } from './booking.service';

@Controller('bookings')
@UseGuards(SessionGuard)
export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  @Post(':id/cancel')
  cancel(@Param('id', ParseUUIDPipe) id: string, @Req() request: Request) {
    if (!request.user) {
      throw new UnauthorizedException();
    }
    return this.bookingService.cancel(id, request.user.id);
  }
}
