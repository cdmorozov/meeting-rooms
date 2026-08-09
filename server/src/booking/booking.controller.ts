import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { SessionGuard } from '../auth/session.guard';
import { BookingService } from './booking.service';
import { CancelBookingQueryDto } from './dto/cancel-booking-query.dto';
import { MyBookingsQueryDto } from './dto/my-bookings-query.dto';

@Controller('bookings')
@UseGuards(SessionGuard)
export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  @Get('my')
  findMine(@Query() query: MyBookingsQueryDto, @Req() request: Request) {
    if (!request.user) {
      throw new UnauthorizedException();
    }
    return this.bookingService.findMine(request.user.id, query);
  }

  @Get('notifications')
  notifications(@Req() request: Request) {
    if (!request.user) {
      throw new UnauthorizedException();
    }
    return this.bookingService.takeEndingSoonNotifications(request.user.id);
  }

  @Post(':id/cancel')
  cancel(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: CancelBookingQueryDto,
    @Req() request: Request,
  ) {
    if (!request.user) {
      throw new UnauthorizedException();
    }
    return this.bookingService.cancel(
      id,
      request.user.id,
      query.scope ?? 'one',
    );
  }
}
