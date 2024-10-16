import {Injectable, OnModuleInit} from '@nestjs/common';
import {PrismaClient} from "@prisma/client";
import {ConfigService} from "@nestjs/config";

@Injectable()
export class DbService extends PrismaClient implements  OnModuleInit
{
    constructor(private readonly configService: ConfigService) {
        super({
           log: ['query', 'info', 'warn', 'error'],
        });
    }
    async onModuleInit()
    {
       await this.$connect();

       // indien environment variabele LOG_SQL = true is, log dan alle SQL queries
       const logging: boolean =   this.configService.get('logging.sql'); // default is false
       if (logging)
       {
          this.$use(async (params, next) =>
          {
             console.log(`Query: ${params.model}.${params.action}`);
             console.log(`Params: ${JSON.stringify(params.args)}`);
             return await next(params);
          });
       }
    }
}
