import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
} from '@nestjs/common';
import { Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    let message = 'Error en el servidor';
    
    // Extraer el mensaje de la excepción
    if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
      const resp = exceptionResponse as any;
      // UnauthorizedException retorna { message: "...", error: "Unauthorized", statusCode: 401 }
      message = resp.message || resp.error || exception.message;
    } else if (typeof exceptionResponse === 'string') {
      message = exceptionResponse;
    }

    const jsonResponse = {
      statusCode: status,
      message: message,
      timestamp: new Date().toISOString(),
    };

    response.status(status).json(jsonResponse);
  }
}
