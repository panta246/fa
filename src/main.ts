import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = app.get(ConfigService);

  const appName = config.getOrThrow<string>('APP_NAME');
  const nodeEnv = config.getOrThrow<string>('NODE_ENV');
  const port = config.getOrThrow<number>('PORT');

  console.log(`[startup] ${appName} (${nodeEnv})`);

  await app.listen(port);
}
void bootstrap();
