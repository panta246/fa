import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';

@Catch()
export class GlobalHttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const req = ctx.getRequest<Request & { id?: string }>();
    const res = ctx.getResponse();

    const requestId = req.id ?? null;
    const method = (req as any).method;
    const path = (req as any).originalUrl ?? (req as any).url;

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let error = 'Internal Server Error';
    let message: string[] = ['Unexpected error'];

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const response = exception.getResponse() as any;

      // Nest can return string or object or { message: [] }
      error = response?.error ?? exception.name ?? 'Error';

      const rawMessage = response?.message ?? exception.message;
      message = Array.isArray(rawMessage) ? rawMessage : [String(rawMessage)];
    } else if (exception instanceof Error) {
      message = [exception.message];
    }

    const body = {
      requestId,
      path,
      method,
      statusCode,
      error,
      message,
      timestamp: Date.now(),
    };

    // log the error with requestId for correlation
    console.error(
      JSON.stringify({
        requestId,
        path,
        method,
        statusCode,
        exception:
          exception instanceof Error
            ? { name: exception.name, message: exception.message }
            : exception,
      }),
    );

    res.status(statusCode).json(body);
  }
}
