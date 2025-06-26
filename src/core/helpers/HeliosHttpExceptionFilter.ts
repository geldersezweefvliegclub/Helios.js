import {ExceptionFilter, Catch, ArgumentsHost, HttpException, BadRequestException} from '@nestjs/common';
import { Response } from 'express';

@Catch(HttpException)
export class HeliosHttpExceptionFilter implements ExceptionFilter {
   catch(exception: HttpException, host: ArgumentsHost) {
      const ctx = host.switchToHttp();
      const response = ctx.getResponse<Response>();
      const status = exception.getStatus();

      // Add the error message to the response headers 'X-Error-Message'
      // Backward compatibility with the old API
      response
         .status(status)
         .header('X-Error-Message', exception.message).json();
   }
}

@Catch(BadRequestException)
export class BadRequestExceptionFilter implements ExceptionFilter {
   catch(exception: BadRequestException, host: ArgumentsHost) {
      const ctx = host.switchToHttp();
      const response = ctx.getResponse<Response>();

      response
         .status(exception.getStatus())
         .header('X-Error-Message', exception.message)
         .json();
   }
}