import {ApiProperty, OmitType} from "@nestjs/swagger";
import {RefTypeDto} from "../../generated/nestjs-dto/refType.dto";
import {RefType} from "@prisma/client";

// een type zoals de API die teruggeeft: gelijk aan RefTypeDto, maar BEDRAG en EENHEDEN zijn getallen in plaats van
// Prisma Decimal strings
export class GetRefTypesResponse extends OmitType(RefTypeDto, ['BEDRAG', 'EENHEDEN'] as const)
{
    @ApiProperty({type: Number, nullable: true, description: 'Het bedrag om te kunnen facturer en'})
    BEDRAG: number | null;

    @ApiProperty({type: Number, nullable: true, description: 'De eenheden om te kunnen boeken, bijvoorbeeld DDWV strippen'})
    EENHEDEN: number | null;

    /**
     * Maakt een instantie op basis van een model object van Prisma.
     * Als je een error krijgt bij het instantiëren van deze class na een Prisma query, zorg er dan voor dat je alle benodigde relaties in je Prisma query hebt opgenomen!
     */
    constructor(obj?: RefType) {
        super();
        this.ID = obj?.ID;
        this.GROEP = obj?.GROEP;
        this.CODE = obj?.CODE;
        this.EXT_REF = obj?.EXT_REF;
        this.OMSCHRIJVING = obj?.OMSCHRIJVING;
        this.SORTEER_VOLGORDE = obj?.SORTEER_VOLGORDE;
        this.READ_ONLY = obj?.READ_ONLY;
        this.BEDRAG = obj?.BEDRAG != null ? obj.BEDRAG.toNumber() : null;
        this.EENHEDEN = obj?.EENHEDEN != null ? obj.EENHEDEN.toNumber() : null;
        this.VERWIJDERD = obj?.VERWIJDERD;
        this.LAATSTE_AANPASSING = obj?.LAATSTE_AANPASSING;
    }
}
