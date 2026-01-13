import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class RequestLoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const http = context.switchToHttp();
    const req = http.getRequest<Request & { id?: string }>();
    const res = http.getResponse();

    const headerId =
      (req.headers as any)['x-request-id'] ||
      (req.headers as any)['X-Request-Id'];

    const requestId = typeof headerId === 'string' ? headerId : randomUUID();
    req.id = requestId;
    res.setHeader('x-request-id', requestId);

    const method = (req as any).method;
    const url = (req as any).originalUrl ?? (req as any).url;

    const start = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const ms = Date.now() - start;
          const statusCode = res.statusCode;
          // minimal structured log
          console.log(
            JSON.stringify({ requestId, method, url, statusCode, ms }),
          );
        },
        error: () => {
          const ms = Date.now() - start;
          const statusCode = res.statusCode;
          console.log(
            JSON.stringify({
              requestId,
              method,
              url,
              statusCode,
              ms,
              error: true,
            }),
          );
        },
      }),
    );
  }
}
