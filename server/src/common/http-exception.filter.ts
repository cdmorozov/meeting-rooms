import { ArgumentsHost, Catch, ExceptionFilter, HttpException } from '@nestjs/common';
import type { Response } from 'express';

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

    const message = hasMessage(body) ? body.message : String(body);
    const text = Array.isArray(message) ? message[0] : message;

    response.status(status).json({ errors: { general: text } });
  }
}
