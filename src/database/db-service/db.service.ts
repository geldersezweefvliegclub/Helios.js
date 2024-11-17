import {HttpException, HttpStatus, Injectable, Logger, OnModuleInit} from '@nestjs/common';
import {Prisma, PrismaClient} from "@prisma/client";
import {ConfigService} from "@nestjs/config";
import {listenForManualRestart} from "@nestjs/cli/lib/compiler/helpers/manual-restart";
import {count} from "rxjs";

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

        const prismaLoggingEnabled: boolean = this.configService.getOrThrow<string>('LOGGING.SQL') === 'true';

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

    async dbQuery<Type> (SQL: string, start?: number, max?: number): Promise<Type>
    {
        if (start && !max)
            throw new HttpException("MAX is required when START is defined", HttpStatus.BAD_REQUEST);

        const offset = start ? "OFFSET " + start : "";
        const limit = max ? "LIMIT " + max : "";

        let count:number = -1;
        if (max || start)
        {
            const countSQL = SQL.replace(/SELECT .* FROM/, "SELECT COUNT(*) FROM");
            const qqq = await this.$queryRawUnsafe(countSQL);
            console.log(qqq);
        }

        const data: never[] = await this.$queryRawUnsafe(SQL + " " + offset + " " + limit);

        if (count < 0)
           count = data.length;

        return undefined
    }
}
