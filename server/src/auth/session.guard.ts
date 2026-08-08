import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { PrismaService } from '../prisma.service';

export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
}

declare module 'express-serve-static-core' {
  interface Request {
    user?: AuthenticatedUser;
  }
}

@Injectable()
export class SessionGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const sessionId = request.cookies?.session_id as string | undefined;

    if (!sessionId) {
      throw new UnauthorizedException();
    }

    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
      select: {
        expiresAt: true,
        user: { select: { id: true, name: true, email: true } },
      },
    });

    if (!session || session.expiresAt < new Date()) {
      throw new UnauthorizedException();
    }

    request.user = session.user;
    return true;
  }
}
