import {ArgumentsHost, Catch, ExceptionFilter, HttpStatus} from "@nestjs/common";
import {Prisma} from "@prisma/client";
import {Response} from "express";

@Catch(Prisma.PrismaClientUnknownRequestError)
@Catch(Prisma.PrismaClientInitializationError)
@Catch(Prisma.PrismaClientRustPanicError)
export class HeliosPrismaClientDefaultError implements ExceptionFilter {
   catch(exception:  Prisma.PrismaClientUnknownRequestError  |
                     Prisma.PrismaClientInitializationError |
                     Prisma.PrismaClientRustPanicError, host: ArgumentsHost)
   {
      const lines = exception.message.split('\n');
      const httpMsg = (lines.length === 0) ? exception.message : lines[lines.length - 1].trim();

      const ctx = host.switchToHttp();
      const response = ctx.getResponse<Response>();

      response
         .status(HttpStatus.BAD_REQUEST)
         .header('X-Error-Message', httpMsg)
         .json();
   }
}