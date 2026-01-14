import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import type { Request, Response } from 'express';

@Injectable()
export class RequestLoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const req = http.getRequest<Request>();
    const res = http.getResponse<Response>();

    const requestId = req.id;

    const method = req.method;
    const path = req.originalUrl ?? req.url;

    const start = Date.now();

    res.once('finish', () => {
      const ms = Date.now() - start;
      const statusCode = res.statusCode;

      console.log(JSON.stringify({ requestId, method, path, statusCode, ms }));
    });

    return next.handle();
  }
}
