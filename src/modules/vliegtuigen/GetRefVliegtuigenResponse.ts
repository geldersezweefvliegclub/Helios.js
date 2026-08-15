import {RefVliegtuigDto} from "../../generated/nestjs-dto/refVliegtuig.dto";
import {RefCompetentie, RefType, RefVliegtuig} from "@prisma/client";
import {ApiProperty} from "@nestjs/swagger";

export class GetRefVliegtuigenResponse extends RefVliegtuigDto {
    /**
     * Maakt een instantie van RefVliegtuigDto, op basis van een RefVliegtuig model object van Prisma.
     * Als je een error krijgt bij het instantiëren van deze class na een Prisma query, zorg er dan voor dat je alle benodigde relaties in je Prisma query hebt opgenomen!
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
        this.BEVOEGDHEID_LOKAAL_ID = obj?.BEVOEGDHEID_LOKAAL_ID;
        this.BEVOEGDHEID_OVERLAND_ID = obj?.BEVOEGDHEID_OVERLAND_ID;

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

    // BEVOEGDHEID_LOKAAL_ID en BEVOEGDHEID_OVERLAND_ID staan al (verplicht, nullable) op de RefVliegtuigDto basisklasse

    @ApiProperty({
        type: String,
        required: false,
        description: 'Omschrijving om vliegtuig lokaal te mogen vliegen',
    })
    BEVOEGDHEID_LOKAAL?: string | null

    @ApiProperty({
        type: String,
        required: false,
        description: 'Omschrijving om met vliegtuig overland te gaan',
    })
    BEVOEGDHEID_OVERLAND?: string | null

    @ApiProperty({
        type: Number,
        required: false,      //TODO: moet true worden als journaal aanwezig is
        description: 'Aantal uitstaande journaals',
    })
    JOURNAAL_AANTAL?: number

    @ApiProperty({
        type: String,
        required: false,
        description: 'Registratie en callsign van het vliegtuig',
    })
    REG_CALL?: string
}