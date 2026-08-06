import { Controller, Get, Param, ParseUUIDPipe, Query, UseGuards } from '@nestjs/common';
import { SessionGuard } from '../auth/session.guard';
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
  findWeekBookings(@Param('id', ParseUUIDPipe) id: string, @Query() query: WeekBookingsQueryDto) {
    return this.roomsService.findWeekBookings(id, query.weekStart);
  }
}
