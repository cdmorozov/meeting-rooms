import { ArgumentsHost, Catch, ExceptionFilter, HttpException } from '@nestjs/common';
import type { Response } from 'express';

interface ErrorsBody {
  errors: unknown;
}

function hasErrors(body: unknown): body is ErrorsBody {
  return typeof body === 'object' && body !== null && 'errors' in body;
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

    const message = typeof body === 'object' && body !== null && 'message' in body
      ? (body as { message: string | string[] }).message
      : String(body);

    response.status(status).json({
      errors: { general: Array.isArray(message) ? message[0] : message },
    });
  }
}
