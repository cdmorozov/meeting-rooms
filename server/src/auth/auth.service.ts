import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import * as argon2 from 'argon2';
import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

// its for defending against timing attacks
const DUMMY_PASSWORD_HASH =
  '$argon2id$v=19$m=65536,p=4,t=3$wxwEaxUukN5wSjxg1v043g$FSDtX7kwvYgVbR23ulOTG2NjTyZvhXCxeZApdcBncpQ';

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  async register(dto: RegisterDto) {
    const passwordHash = await argon2.hash(dto.password);

    let user: { id: string; name: string; email: string };
    try {
      user = await this.prisma.user.create({
        data: { name: dto.name, email: dto.email, passwordHash },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Email already registered');
      }
      throw error;
    }

    return this.createSession(user);
  }

  async login(dto: LoginDto) {
    await this.prisma.session.deleteMany({ where: { expiresAt: { lt: new Date() } } });

    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    const passwordMatches = await argon2.verify(user?.passwordHash ?? DUMMY_PASSWORD_HASH, dto.password);

    if (!user || !passwordMatches) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return this.createSession(user);
  }

  async logout(sessionId: string) {
    await this.prisma.session.deleteMany({ where: { id: sessionId } });
  }

  private async createSession(user: { id: string; name: string; email: string }) {
    const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
    const session = await this.prisma.session.create({
      data: { userId: user.id, expiresAt },
    });

    return {
      user: { id: user.id, name: user.name, email: user.email },
      sessionId: session.id,
      expiresAt,
    };
  }
}
