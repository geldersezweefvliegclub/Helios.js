import {ExceptionFilter, Catch, ArgumentsHost, HttpException, BadRequestException, Logger} from '@nestjs/common';
import { Response } from 'express';
import {logFailedRequest} from "./LogHelper";

@Catch(HttpException)
export class HeliosHttpExceptionFilter implements ExceptionFilter {
   private readonly logger = new Logger(HeliosHttpExceptionFilter.name);

   catch(exception: HttpException, host: ArgumentsHost) {
      const ctx = host.switchToHttp();
      const response = ctx.getResponse<Response>();
      const status = exception.getStatus();

      logFailedRequest(this.logger, host, status, exception.message);

      // Voeg de foutmelding toe aan de response header 'X-Error-Message'
      // Backward compatibility met de oude API
      response
         .status(status)
         .header('X-Error-Message', exception.message).json();
   }
}

@Catch(BadRequestException)
export class BadRequestExceptionFilter implements ExceptionFilter {
   private readonly logger = new Logger(BadRequestExceptionFilter.name);

   catch(exception: BadRequestException, host: ArgumentsHost) {
      const ctx = host.switchToHttp();
      const response = ctx.getResponse<Response>();

      logFailedRequest(this.logger, host, exception.getStatus(), exception.message);

      response
         .status(exception.getStatus())
         .header('X-Error-Message', exception.message)
         .json();
   }
}