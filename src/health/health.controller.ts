import { Controller, Get, Version } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get()
  @Version('1')
  health() {
    return {
      status: 'ok',
      app: process.env.APP_NAME ?? 'unknown',
      env: process.env.NODE_ENV ?? 'unknown',
      timestamp: Date.now(),
    };
  }
}
