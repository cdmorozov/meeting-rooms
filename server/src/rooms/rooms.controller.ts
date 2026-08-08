import {
  Body,
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
import { CreateBookingDto } from './dto/create-booking.dto';
import { WeekBookingsQueryDto } from './dto/week-bookings-query.dto';
import { RoomsService } from './rooms.service';

@Controller('rooms')
@UseGuards(SessionGuard)
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  @Get()
  findAll() {
    return this.roomsService.findAll();
  }

  @Get(':id/bookings')
  findWeekBookings(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: WeekBookingsQueryDto,
  ) {
    return this.roomsService.findWeekBookings(id, query.weekStart);
  }

  @Post(':id/bookings')
  createBooking(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateBookingDto,
    @Req() request: Request,
  ) {
    if (!request.user) {
      throw new UnauthorizedException();
    }
    return this.roomsService.createBooking(id, request.user.id, dto);
  }
}
