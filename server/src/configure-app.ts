import {
  BadRequestException,
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { HttpExceptionFilter } from './common/http-exception.filter';

export function configureApp(app: INestApplication): void {
  app.setGlobalPrefix('api');
  app.use(cookieParser());
  app.enableCors({ origin: process.env.WEB_ORIGIN, credentials: true });
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      exceptionFactory: (validationErrors) => {
        const errors: Record<string, string> = {};
        for (const error of validationErrors) {
          const firstMessage = Object.values(error.constraints ?? {})[0];
          if (firstMessage) {
            errors[error.property] = firstMessage;
          }
        }

        return new BadRequestException({ errors });
      },
    }),
  );
}
