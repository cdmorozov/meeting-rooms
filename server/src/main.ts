import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
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
  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
