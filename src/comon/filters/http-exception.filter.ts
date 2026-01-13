import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import type { ErrorResponse } from '../types/error-response';

type RequestWithId = Request & { id?: string };

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
    // preserve information instead of "[object Object]"
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
    const req = ctx.getRequest<RequestWithId>();
    const res = ctx.getResponse<Response>();

    const requestId = req.id ?? null;
    const method = req.method;
    const path = req.originalUrl ?? req.url;

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let error = 'Internal Server Error';
    let message: string[] = ['Unexpected error'];

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const resp = exception.getResponse();

      if (typeof resp === 'string') {
        // sometimes Nest returns a string response
        error = exception.name;
        message = [resp];
      } else if (resp && typeof resp === 'object') {
        // typical shape: { statusCode, message, error }
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

    const body: ErrorResponse = {
      requestId,
      path,
      method,
      statusCode,
      error,
      message,
      timestamp: Date.now(),
    };

    // Server-side log (can be improved later)
    console.error(
      JSON.stringify({
        requestId,
        method,
        path,
        statusCode,
        exception:
          exception instanceof Error
            ? {
                name: exception.name,
                message: exception.message,
                stack: exception.stack,
              }
            : exception,
      }),
    );

    res.status(statusCode).json(body);
  }
}
