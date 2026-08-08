import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
} from '@nestjs/common';
import type { Response } from 'express';

const UNEXPECTED_ERROR = 'Сталася непередбачена помилка';

interface ErrorsBody {
  errors: unknown;
}

interface MessageBody {
  message: string | string[];
}

function hasErrors(body: unknown): body is ErrorsBody {
  return typeof body === 'object' && body !== null && 'errors' in body;
}

function hasMessage(body: unknown): body is MessageBody {
  return typeof body === 'object' && body !== null && 'message' in body;
}

function generalMessage(body: string | object): string {
  if (hasMessage(body)) {
    return Array.isArray(body.message) ? body.message[0] : body.message;
  }
  if (typeof body === 'string') {
    return body;
  }
  return UNEXPECTED_ERROR;
}

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();
    const status = exception.getStatus();
    const body = exception.getResponse();

    if (hasErrors(body)) {
      response.status(status).json({ errors: body.errors });
      return;
    }

    response.status(status).json({ errors: { general: generalMessage(body) } });
  }
}
