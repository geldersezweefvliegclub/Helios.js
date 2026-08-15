import {RefTypeDto} from "../../generated/nestjs-dto/refType.dto";
import {RefType} from "@prisma/client";

export class GetRefTypesResponse extends RefTypeDto
{
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
        this.BEDRAG = obj?.BEDRAG;
        this.EENHEDEN = obj?.EENHEDEN;
        this.VERWIJDERD = obj?.VERWIJDERD;
        this.LAATSTE_AANPASSING = obj?.LAATSTE_AANPASSING;
    }
}