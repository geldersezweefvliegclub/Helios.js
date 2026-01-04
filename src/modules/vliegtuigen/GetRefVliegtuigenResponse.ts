import {RefVliegtuigDto} from "../../generated/nestjs-dto/refVliegtuig.dto";
import {RefCompetentie, RefType, RefVliegtuig} from "@prisma/client";
import {ApiProperty} from "@nestjs/swagger";

export class GetRefVliegtuigenResponse extends RefVliegtuigDto {
    /**
     * Creates an instance of RefVliegtuigDto, from a RefVliegtuig model object from Prisma.
     * If you get an error when instantiating this class after querying using Prisma, make sure you included all necessary relations in your Prisma query!
     */
    constructor(obj?: RefVliegtuig & {
        VliegtuigType?: RefType,
        BevoegdheidLokaal?: RefCompetentie,
        BevoegdheidOverland?: RefCompetentie
    }) {
        super();
        this.ID = obj?.ID;
        this.REGISTRATIE = obj?.REGISTRATIE;
        this.CALLSIGN = obj?.CALLSIGN;
        this.ZITPLAATSEN = obj?.ZITPLAATSEN;
        this.CLUBKIST = obj?.CLUBKIST;
        this.FLARMCODE = obj?.FLARMCODE;
        this.TYPE_ID = obj?.TYPE_ID;
        this.ZELFSTART = obj?.ZELFSTART;
        this.TMG = obj?.TMG;
        this.SLEEPKIST = obj?.SLEEPKIST;
        this.INZETBAAR = obj?.INZETBAAR;
        this.VOLGORDE = obj?.VOLGORDE;
        this.TRAINER = obj?.TRAINER;
        this.URL = obj?.URL;
        this.OPMERKINGEN = obj?.OPMERKINGEN;
        this.VERWIJDERD = obj?.VERWIJDERD;
        this.LAATSTE_AANPASSING = obj?.LAATSTE_AANPASSING;

        this.VLIEGTUIGTYPE = obj?.VliegtuigType?.OMSCHRIJVING;
        this.BEVOEGDHEID_LOKAAL = obj?.BevoegdheidLokaal?.OMSCHRIJVING;
        this.BEVOEGDHEID_OVERLAND = obj?.BevoegdheidOverland?.OMSCHRIJVING;
    }


    @ApiProperty({
        type: String,
        required: true,
        description: 'Omschrijving van het vliegtuig type',
    })
    VLIEGTUIGTYPE?: string

    @ApiProperty({
        type: String,
        required: false,
        description: 'Omschrijving om vliegtuig lokaal te mogen vliegen',
    })
    BEVOEGDHEID_LOKAAL?: string

    @ApiProperty({
        type: String,
        required: false,
        description: 'Omschrijving om met vliegtuig overland te gaan',
    })
    BEVOEGDHEID_OVERLAND?: string

    @ApiProperty({
        type: Number,
        required: false,      //TODO: moet true worden als journaal aanwezig is
        description: 'Aantal uitstaande journaals',
    })
    JOURNAAL_AANTAL?: number
}