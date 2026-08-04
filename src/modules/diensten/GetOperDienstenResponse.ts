import {ApiProperty, ApiTags} from "@nestjs/swagger";
import {OperDienstDto} from "../../generated/nestjs-dto/operDienst.dto";
import {OperDienst, RefLid, RefType} from "@prisma/client";
import {toDateOnly} from "../../core/helpers/DateOnly";

@ApiTags('DagRapporten')
export class GetOperDienstenResponse extends OperDienstDto {
    constructor(dienst?: OperDienst & { TypeDienst?: RefType, RefLid?: RefLid, RefIngevoerd?: RefLid }) {
        super();

        this.ID = dienst?.ID;
        this.DATUM = toDateOnly(dienst?.DATUM) as unknown as Date;
        this.LID_ID = dienst?.LID_ID;
        this.ROOSTER_ID = dienst?.ROOSTER_ID;
        this.TYPE_DIENST_ID = dienst?.TYPE_DIENST_ID;
        this.TYPE_DIENST = dienst?.TypeDienst?.OMSCHRIJVING;
        this.INGEVOERD_DOOR_ID = dienst?.INGEVOERD_DOOR_ID;
        this.AANWEZIG = dienst?.AANWEZIG;
        this.AFWEZIG = dienst?.AFWEZIG;
        this.UITBETAALD = dienst?.UITBETAALD;
        this.VERWIJDERD = dienst?.VERWIJDERD;
        this.LAATSTE_AANPASSING = dienst?.LAATSTE_AANPASSING;
        this.NAAM = dienst?.RefLid?.NAAM;
        this.INGEVOERD_DOOR = dienst?.RefIngevoerd?.NAAM;
    }

    @ApiProperty({
        description: "Omschrijving van het type dienst (startleider, DDI, lietrist, etc)",
        type: "integer",
        format: "int32",
        nullable: true,
    })
    TYPE_DIENST: string | null;

    @ApiProperty({
        description: "Naam van het lid dat ingeroosterd is",
        type: "string",
        nullable: true,
    })
    NAAM?: string | null;

    @ApiProperty({
        description: "Naam van het lid dat de dienst heeft ingevoerd",
        type: "string",
        nullable: true,
    })
    INGEVOERD_DOOR?: string | null;
}