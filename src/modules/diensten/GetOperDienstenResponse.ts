import {ApiProperty, ApiTags} from "@nestjs/swagger";
import {OperDienstDto} from "../../generated/nestjs-dto/operDienst.dto";
import {OperDienst, RefType} from "@prisma/client";

@ApiTags('DagRapporten')
export class GetOperDienstenResponse extends OperDienstDto {
    constructor(dienst?: OperDienst & { TypeDienst: RefType }) {
        super();

        this.ID = dienst?.ID;
        this.DATUM = dienst?.DATUM;
        this.LID_ID = dienst?.LID_ID;
        this.ROOSTER_ID = dienst?.ROOSTER_ID;
        this.TYPE_DIENST_ID = dienst?.TYPE_DIENST_ID;
        this.TYPE_DIENST = dienst?.TypeDienst?.OMSCHRIJVING;
        this.INGEVOERD_DOOR_ID = dienst?.INGEVOERD_DOOR_ID;
        this.UITBETAALD = dienst?.UITBETAALD;
        this.VERWIJDERD = dienst?.VERWIJDERD;
        this.LAATSTE_AANPASSING = dienst?.LAATSTE_AANPASSING;
    }

    @ApiProperty({
        description: "Omschrijving van het type dienst (startleider, DDI, lietrist, etc)",
        type: "integer",
        format: "int32",
        nullable: true,
    })
    TYPE_DIENST: string | null;
}