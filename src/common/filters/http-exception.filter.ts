import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let payload = {
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Something went wrong',
      },
    };

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (
        typeof exceptionResponse === 'object' &&
        exceptionResponse !== null &&
        'success' in exceptionResponse
      ) {
        payload = exceptionResponse as typeof payload;
      } else {
        payload = {
          success: false,
          error: {
            code:
              statusCode === HttpStatus.BAD_REQUEST
                ? 'VALIDATION_ERROR'
                : 'HTTP_ERROR',
            message:
              typeof exceptionResponse === 'string'
                ? exceptionResponse
                : 'Request failed',
          },
        };
      }
    }

    response.status(statusCode).json(payload);
  }
}
