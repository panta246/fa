import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { envSchema } from './config/env.schema';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // because of this we don't need to import everywhere
      validate: (rawEnv) => {
        const parsed = envSchema.safeParse(rawEnv);
        if (!parsed.success) {
          const prettyError = JSON.stringify(parsed.error.format(), null, 2);
          throw new Error(`Invalid environment variables: \n${prettyError}`);
        }
        return parsed.data;
      },
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
