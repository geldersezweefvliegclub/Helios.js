import {ArgumentsHost, Catch, ExceptionFilter, HttpStatus, Logger} from "@nestjs/common";
import {Prisma} from "@prisma/client";
import {Response} from "express";
import {logFailedRequest} from "./LogHelper";

@Catch(Prisma.PrismaClientUnknownRequestError)
@Catch(Prisma.PrismaClientInitializationError)
@Catch(Prisma.PrismaClientRustPanicError)
export class HeliosPrismaClientDefaultError implements ExceptionFilter {
   private readonly logger = new Logger(HeliosPrismaClientDefaultError.name);

   catch(exception:  Prisma.PrismaClientUnknownRequestError  |
                     Prisma.PrismaClientInitializationError |
                     Prisma.PrismaClientRustPanicError, host: ArgumentsHost)
   {
      const lines = exception.message.split('\n');
      const httpMsg = (lines.length === 0) ? exception.message : lines[lines.length - 1].trim();

      logFailedRequest(this.logger, host, HttpStatus.BAD_REQUEST, httpMsg);

      const ctx = host.switchToHttp();
      const response = ctx.getResponse<Response>();

      response
         .status(HttpStatus.BAD_REQUEST)
         .header('X-Error-Message', httpMsg)
         .json();
   }
}