import {Injectable, OnModuleInit} from '@nestjs/common';
import {PrismaClient} from "@prisma/client";

@Injectable()
export class DbService extends PrismaClient implements  OnModuleInit
{
    constructor() {
        super({
           log: ['query', 'info', 'warn', 'error'],
        });
    }
    async onModuleInit()
    {
       await this.$connect();

       this.$use(async (params, next) => {
          console.log(`Query: ${params.model}.${params.action}`);
          console.log(`Params: ${JSON.stringify(params.args)}`);
          const result = await next(params);
          return result;
       });
    }
}
