import {RefTypeDto} from "../../generated/nestjs-dto/refType.dto";
import {RefType} from "@prisma/client";

export class GetRefTypesResponse extends RefTypeDto
{
    /**
     * Creates an instance from a model object from Primsa.
     * If you get an error when instantiating this class after quering using Primsa, make sure you included all necessary relations in your Prisma query!
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