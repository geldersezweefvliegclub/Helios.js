import {Injectable, Logger, OnModuleInit} from '@nestjs/common';
import {Prisma, PrismaClient} from "@prisma/client";
import {ConfigService} from "@nestjs/config";


@Injectable()
export class DbService extends PrismaClient implements  OnModuleInit
{
    private readonly logger = new Logger(DbService.name);

    // TODO: TEGOED er helemaal uithalen
    constructor(private readonly configService: ConfigService) {
        super({
            // TEGOED blijft als kolom in ref_leden bestaan, maar wordt nergens meer gebruikt - nooit ophalen
            omit: {
                refLid: {TEGOED: true},
            },
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

        this.legeTekstAlsNull();
    }

    async onModuleInit()
    {
       await this.$connect();

        const prismaLoggingEnabled: boolean = this.configService.getOrThrow<boolean>('LOGGING.SQL');

        // indien environment variabele LOG_SQL = true is, log dan alle SQL queries
        if (prismaLoggingEnabled) {
            this.$on('error' as never, (event: Prisma.LogEvent) => {
                this.logger.error(`Prisma error: ${event.message}`, {
                    message: event.message,
                    target: event.target,
                });
            });

            this.$on('info' as never, (event: Prisma.LogEvent) => {
                this.logger.debug(`Prisma info: ${event.message}`, {
                    message: event.message,
                    target: event.target,
                });
            });

            this.$on('query' as never, (event: Prisma.QueryEvent) => {
                this.logger.debug(`Executed Prisma query - Duration: ${event.duration}ms`, {
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

    // Een leeggemaakt tekstveld komt als "" binnen. Sla dat op als null in tekstkolommen die null mogen zijn, zodat een
    // leeg veld altijd null is (niet soms "" en soms null). Verplichte kolommen houden hun waarde. Welke kolommen null
    // mogen zijn komt uit het Prisma schema. Dit geldt voor alle create/update aanroepen via dbService.<model>, daarom
    // worden de model properties (dbService.refLid enz.) via een client extension afgehandeld
    private legeTekstAlsNull(): void
    {
        const nullbareTekst = new Map<string, Set<string>>();
        for (const model of Prisma.dmmf.datamodel.models)
        {
            const velden = model.fields.filter(veld => veld.kind === 'scalar' && veld.type === 'String' && !veld.isRequired);
            nullbareTekst.set(model.name, new Set(velden.map(veld => veld.name)));
        }

        const opschonen = (model: string, data: unknown): void =>
        {
            const velden = nullbareTekst.get(model);
            const records = Array.isArray(data) ? data : [data];
            for (const record of records)
            {
                if (!velden || !record || typeof record !== 'object')
                    continue;
                for (const [veld, waarde] of Object.entries(record))
                {
                    if (waarde === '' && velden.has(veld))
                        (record as Record<string, unknown>)[veld] = null;
                }
            }
        };

        const extended = this.$extends({
            query: {
                $allModels: {
                    async create({model, args, query}) { opschonen(model, args.data); return query(args); },
                    async createMany({model, args, query}) { opschonen(model, args.data); return query(args); },
                    async update({model, args, query}) { opschonen(model, args.data); return query(args); },
                    async updateMany({model, args, query}) { opschonen(model, args.data); return query(args); },
                    async upsert({model, args, query}) { opschonen(model, args.create); opschonen(model, args.update); return query(args); },
                },
            },
        });

        // dbService.<model> via de extension laten lopen; de rest van DbService ($connect, $on, ...) blijft ongewijzigd
        for (const model of Prisma.dmmf.datamodel.models)
        {
            const property = model.name.charAt(0).toLowerCase() + model.name.slice(1);
            Object.defineProperty(this, property, {
                get: () => (extended as unknown as Record<string, unknown>)[property],
                configurable: true,
            });
        }
    }
}
