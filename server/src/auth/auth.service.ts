import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import * as argon2 from 'argon2';
import { randomUUID } from 'node:crypto';
import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

interface SessionUser {
  id: string;
  name: string;
  email: string;
  emailVerifiedAt: Date | null;
}

// хеш для захисту від таймінг атак
const DUMMY_PASSWORD_HASH =
  '$argon2id$v=19$m=65536,p=4,t=3$wxwEaxUukN5wSjxg1v043g$FSDtX7kwvYgVbR23ulOTG2NjTyZvhXCxeZApdcBncpQ';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(private readonly prisma: PrismaService) {}

  async register(dto: RegisterDto) {
    const passwordHash = await argon2.hash(dto.password);
    const verificationToken = randomUUID();

    let user: SessionUser;
    try {
      user = await this.prisma.user.create({
        data: {
          name: dto.name,
          email: dto.email,
          passwordHash,
          verificationToken,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException({
          errors: { email: 'Ця електронна адреса вже зареєстрована' },
        });
      }
      throw error;
    }

    this.logVerificationLink(user.email, verificationToken);

    return this.createSession(user);
  }

  async verifyEmail(token: string) {
    const user = await this.prisma.user.findUnique({
      where: { verificationToken: token },
    });

    if (!user) {
      throw new BadRequestException({
        errors: { general: 'Посилання недійсне або вже використане' },
      });
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { emailVerifiedAt: new Date(), verificationToken: null },
    });

    return { email: user.email };
  }

  async login(dto: LoginDto) {
    await this.prisma.session.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });

    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    const passwordMatches = await argon2.verify(
      user?.passwordHash ?? DUMMY_PASSWORD_HASH,
      dto.password,
    );

    if (!user || !passwordMatches) {
      throw new UnauthorizedException({
        errors: { general: 'Неправильний email або пароль' },
      });
    }

    return this.createSession(user);
  }

  async logout(sessionId: string) {
    await this.prisma.session.deleteMany({ where: { id: sessionId } });
  }

  private logVerificationLink(email: string, token: string) {
    const webOrigin = process.env.WEB_ORIGIN ?? 'http://localhost:5173';
    this.logger.log(
      `Підтвердження email для ${email}: ${webOrigin}/verify?token=${token}`,
    );
  }

  private async createSession(user: SessionUser) {
    const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
    const session = await this.prisma.session.create({
      data: { userId: user.id, expiresAt },
    });

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        emailVerified: user.emailVerifiedAt !== null,
      },
      sessionId: session.id,
      expiresAt,
    };
  }
}
