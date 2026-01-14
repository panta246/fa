import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
// import { randomUUID } from 'crypto';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';
import type { Request, Response } from 'express';

// type RequestWithId = Request & { id: string };

@Injectable()
export class RequestLoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const req = http.getRequest<Request>();
    const res = http.getResponse<Response>();

    // Read header safely
    // const headerId = req.header('x-request-id'); // string | undefined

    // const requestId = headerId && headerId.trim() ? headerId : randomUUID();
    const requestId = req.id;

    // req.id = requestId;
    // res.setHeader('x-request-id', requestId);

    const method = req.method;
    const path = req.originalUrl ?? req.url;

    const start = Date.now();

    return next.handle().pipe(
      finalize(() => {
        const ms = Date.now() - start;
        const statusCode = res.statusCode;

        console.log(
          JSON.stringify({
            requestId,
            method,
            path,
            statusCode,
            ms,
          }),
        );
      }),
    );
  }
}
