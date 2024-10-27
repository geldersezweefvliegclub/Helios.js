import {Injectable, Logger, OnModuleInit} from '@nestjs/common';
import {Prisma, PrismaClient} from "@prisma/client";
import {ConfigService} from "@nestjs/config";

@Injectable()
export class DbService extends PrismaClient implements  OnModuleInit
{
    constructor(private readonly configService: ConfigService, private readonly logger: Logger) {
        super({
            log: [
                {
                    emit: 'event',
                    level: 'query',
                },
                {
                    emit: 'event',
                    level: 'error',
                },
                {
                    emit: 'event',
                    level: 'info',
                },
                {
                    emit: 'event',
                    level: 'warn',
                },
            ],
        });
    }

    async onModuleInit()
    {
       await this.$connect();

        const prismaLoggingEnabled: boolean =   this.configService.get('logging.sql');

        // indien environment variabele LOG_SQL = true is, log dan alle SQL queries
        if (prismaLoggingEnabled) {
            this.$on('error' as never, (event: Prisma.LogEvent) => {
                this.logger.error(`Prisma error: ${event.message}`, {
                    message: event.message,
                    target: event.target,
                });
            });

            this.$on('info' as never, (event: Prisma.LogEvent) => {
                this.logger.log(`Prisma info: ${event.message}`, {
                    message: event.message,
                    target: event.target,
                });
            });

            this.$on('query' as never, (event: Prisma.QueryEvent) => {
                this.logger.log(`Executed Prisma query - Duration: ${event.duration}ms`, {
                    query: event.query,
                    params: event.params,
                    duration: event.duration
                });
            });

            this.$on('warn' as never, (event: Prisma.LogEvent) => {
                this.logger.warn(`Prisma warning: ${event.message}`, {
                    message: event.message,
                    target: event.target,
                });
            });
        }
    }
}
