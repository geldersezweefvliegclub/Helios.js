import {IsDate, IsInt, IsOptional} from "class-validator";
import {Type} from "class-transformer";
import {
    OptionalBooleanTransform,
    OptionalNumberTransform,
    CSVTransform,
    OptionalDateTransform
} from "../helpers/Transformers";
import {ApiProperty} from "@nestjs/swagger";

// class as query parameter to get a single object
export class GetObjectRequest {
    @IsInt()
    @Type(() => Number)
    @ApiProperty(
        {
            name: 'ID',
            required: true,
            type: Number
        })
    public ID: number;
}

// base class as query parameter to get multiple objects via the GetObjects call
export class GetObjectsRequest {
    @IsOptional()
    @OptionalNumberTransform()
    @ApiProperty(
        {
            name: 'ID',
            description: 'Enkel ID ophalen',
            required: false,
            type: Number
        })
    public ID?: number;

    @IsOptional()
    @CSVTransform()
    @ApiProperty(
        {
            name: 'IDs',
            description: 'Comma separated lijst van IDs',
            required: false,
            type: String
        })
    public IDs?: number[];

    @IsOptional()
    @OptionalBooleanTransform()
    @ApiProperty(
        {
            name: 'VERWIJDERD',
            description: 'Als "true", dan worden alleen de verwijderde records opgehaald',
            required: false,
            type: Boolean
        })
    public VERWIJDERD?: boolean;

    @IsOptional()
    @ApiProperty(
        {
            name: 'HASH',
            description: 'Hash van de data. Als de hash hetzelfde is als de hash van de data, dan is komt HTTP 304 terug.',
            required: false,
            type: String
        })
    public HASH?: string;

    @IsOptional()
    @IsOptional()
    @ApiProperty(
        {
            name: 'SORT',
            description: 'Sorteer volgorde als CSV lijst. Bijvoorbeeld: "LIDTYPE, ID DESC"',
            required: false,
            type: String
        })
    public SORT?: string;

    @IsOptional()
    @OptionalNumberTransform()
    @ApiProperty(
        {
            name: 'MAX',
            description: 'Maximaal aantal records',
            required: false,
            type: Number
        })
    public MAX?: number;

    @IsOptional()
    @OptionalNumberTransform()
    @ApiProperty(
        {
            name: 'START',
            description: 'Start record',
            required: false,
            type: Number
        })
    public START?: number;

    @IsOptional()
    @ApiProperty(
        {
            name: 'VELDEN',
            description: 'Niet meer in gebruik, aanwezig voor compatiblity',
            required: false,
            type: String
        })
    public VELDEN?: string;
}


export interface IVanTotDatum {
    start: Date,
    eind: Date
}

// The generic class when a DATUM field is available in the object
export class GetObjectsDateRequest extends GetObjectsRequest {
    @IsOptional()
    @OptionalDateTransform()
    @IsDate()
    @ApiProperty(
        {
            name: 'DATUM',
            required: false,
            type: Date
        })
    public DATUM?: Date;

    @IsOptional()
    @IsDate()
    @OptionalDateTransform()
    @ApiProperty(
        {
            name: 'BEGIN_DATUM',
            required: false,
            type: Date
        })
    public BEGIN_DATUM?: Date;

    @IsOptional()
    @IsDate()
    @OptionalDateTransform()
    @ApiProperty(
        {
            name: 'EIND_DATUM',
            required: false,
            type: Date
        })
    public EIND_DATUM?: Date;

    /**
     * Bepaalt een tijdsinterval op basis van opgegeven datums.
     *
     * Regels:
     * - DATUM mag niet gecombineerd worden met BEGIN_DATUM of EIND_DATUM.
     * - Alleen BEGIN_DATUM: bereik loopt tot einde van het huidige jaar.
     * - Alleen EIND_DATUM: bereik start aan het begin van het huidige jaar.
     * - Geen datums: volledig huidige jaar.
     * - Zowel BEGIN_DATUM als EIND_DATUM: BEGIN_DATUM moet <= EIND_DATUM zijn.
     *
     * Grenzen worden genormaliseerd naar 00:00:00.000 en 23:59:59.999 van de betreffende dagen.
     *
     * @param datum Specifieke dag waarvoor het interval exact die dag beslaat.
     * @param beginDatum Eerste dag van een bereik.
     * @param eindDatum Laatste dag van een bereik.
     * @returns Object met `start` en `eind` (Date) als genormaliseerde grenzen.
     *
     * @example
     * // Enkel een dag
     * VanTot(new Date('2025-05-10'), undefined, undefined)
     * @example
     * // Bereik met begin en eind
     * VanTot(undefined, new Date('2025-01-01'), new Date('2025-01-31'))
     * @example
     * // Alleen begin (tot einde jaar)
     * VanTot(undefined, new Date('2025-03-01'), undefined)
     * @example
     * // Alleen eind (vanaf start jaar)
     * VanTot(undefined, undefined, new Date('2025-06-30'))
     */
    VanTot(datum: Date | undefined, beginDatum: Date | undefined, eindDatum: Date | undefined): IVanTotDatum {
        if (datum && (beginDatum || eindDatum)) {
            throw new Error("Ongeldige combinatie van parameters: DATUM mag niet samen met BEGIN_DATUM of EIND_DATUM worden gebruikt.");
        }

        const beginVanDag = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
        const eindVanDag  = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);

        if (datum) {
            const start = beginVanDag(datum);
            const eind  = eindVanDag(datum);
            return { start, eind };
        }

        const vandaag = new Date();
        const beginHuidigJaar = new Date(vandaag.getFullYear(), 0, 1, 0, 0, 0, 0);
        const eindHuidigJaar  = new Date(vandaag.getFullYear(), 11, 31, 23, 59, 59, 999);

        let ruweStart: Date;
        let ruweEind: Date;

        if (beginDatum && eindDatum) {
            if (beginDatum > eindDatum) {
                throw new Error("Ongeldige parameters: BEGIN_DATUM mag niet later zijn dan EIND_DATUM.");
            }
            ruweStart = beginDatum;
            ruweEind  = eindDatum;
        } else if (beginDatum) {
            ruweStart = beginDatum;
            ruweEind  = eindHuidigJaar;
        } else if (eindDatum) {
            ruweStart = beginHuidigJaar;
            ruweEind  = eindDatum;
        } else {
            ruweStart = beginHuidigJaar;
            ruweEind  = eindHuidigJaar;
        }

        const start = beginVanDag(ruweStart);
        const eind  = eindVanDag(ruweEind);
        return { start, eind };
    }

}

