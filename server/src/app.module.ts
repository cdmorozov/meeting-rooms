import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { BookingModule } from './booking/booking.module';
import { PrismaModule } from './prisma.module';
import { RoomsModule } from './rooms/rooms.module';

@Module({
  imports: [ConfigModule.forRoot({ envFilePath: '../.env' }), PrismaModule, AuthModule, RoomsModule, BookingModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
