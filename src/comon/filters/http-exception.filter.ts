import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import type { ErrorResponse } from '../types/error-response';
import { redact } from '../logging/redact';

function toStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.flatMap((v) => toStringArray(v));
  }

  if (typeof value === 'string') {
    return [value];
  }

  if (value === null || value === undefined) {
    return ['Unexpected error'];
  }

  if (typeof value === 'object') {
    try {
      return [JSON.stringify(value)];
    } catch {
      return ['Unexpected error'];
    }
  }

  if (
    typeof value === 'number' ||
    typeof value === 'boolean' ||
    typeof value === 'bigint'
  ) {
    return [value.toString()];
  }
  if (typeof value === 'symbol') {
    return [value.description ?? value.toString()];
  }

  return ['Unexpected error'];
}

@Catch()
export class GlobalHttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const req = ctx.getRequest<Request>();
    const res = ctx.getResponse<Response>();

    const requestId = req.id ?? null;
    const method = req.method;
    const path = req.originalUrl ?? req.url;

    let statusCode: number = HttpStatus.INTERNAL_SERVER_ERROR;
    let error = 'Internal Server Error';
    let message: string[] = ['Unexpected error'];

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const resp = exception.getResponse();

      if (typeof resp === 'string') {
        error = exception.name;
        message = [resp];
      } else if (resp && typeof resp === 'object') {
        const r = resp as Record<string, unknown>;
        error = typeof r.error === 'string' ? r.error : exception.name;
        message = toStringArray(r.message ?? exception.message);
      } else {
        error = exception.name;
        message = [exception.message];
      }
    } else if (exception instanceof Error) {
      message = [exception.message];
    }

    const isProd = process.env.NODE_ENV === 'production';
    if (isProd && statusCode >= 500) {
      message = ['Internal server error'];
    }
    const body: ErrorResponse = {
      requestId,
      path,
      method,
      statusCode,
      error,
      message,
      timestamp: Date.now(),
    };

    const logBase = {
      requestId,
      path,
      method,
      statusCode,
      error,
      message,
    };

    if (statusCode >= 500) {
      const err =
        exception instanceof Error
          ? {
              name: exception.name,
              message: exception.message,
              stack: exception.stack,
            }
          : exception;

      console.error(JSON.stringify({ ...logBase, exception: redact(err) }));
    } else {
      // 4xx: expected
      console.warn(JSON.stringify(logBase));
    }

    res.status(statusCode).json(body);
  }
}
