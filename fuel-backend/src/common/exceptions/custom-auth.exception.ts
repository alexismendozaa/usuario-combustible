import { HttpException, HttpStatus } from '@nestjs/common';

export class CustomAuthException extends HttpException {
  constructor(message: string) {
    super(
      {
        statusCode: HttpStatus.UNAUTHORIZED,
        message: message,
        error: 'Unauthorized',
      },
      HttpStatus.UNAUTHORIZED,
    );
  }
}
