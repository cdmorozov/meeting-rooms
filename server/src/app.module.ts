import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma.module';

@Module({
  imports: [ConfigModule.forRoot({ envFilePath: '../.env' }), PrismaModule, AuthModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
