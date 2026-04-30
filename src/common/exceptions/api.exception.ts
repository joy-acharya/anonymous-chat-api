import { HttpException, HttpStatus } from '@nestjs/common';

export class ApiException extends HttpException {
  constructor(
    public readonly code: string,
    message: string,
    statusCode: HttpStatus,
  ) {
    super(
      {
        success: false,
        error: {
          code,
          message,
        },
      },
      statusCode,
    );
  }
}
