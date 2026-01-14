import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { RequestLoggingInterceptor } from './comon/interceptors/request-logging.interceptor';
import { GlobalHttpExceptionFilter } from './comon/filters/http-exception.filter';
import { Request, Response } from 'express';
import { randomUUID } from 'crypto';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = app.get(ConfigService);

  const appName = config.getOrThrow<string>('APP_NAME');
  const nodeEnv = config.getOrThrow<string>('NODE_ENV');
  const port = config.getOrThrow<number>('PORT');

  console.log(`[startup] ${appName} (${nodeEnv})`);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.useGlobalInterceptors(new RequestLoggingInterceptor());
  app.useGlobalFilters(new GlobalHttpExceptionFilter());

  app.enableShutdownHooks();

  // every request bad or right will have requestId for log
  app.use((req: Request, res: Response, next: () => void) => {
    const headerId = req.headers['x-request-id'];
    const requestId =
      typeof headerId === 'string' && headerId.trim() ? headerId : randomUUID();

    req.id = requestId;
    res.setHeader('x-request-id', requestId);

    next();
  });

  app.setGlobalPrefix('api');
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  await app.listen(port);
}
void bootstrap();
