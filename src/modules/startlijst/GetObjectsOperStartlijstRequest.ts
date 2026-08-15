import {GetObjectsDateRequest} from "../../core/DTO/IHeliosFilter";
import {IsInt, IsOptional, IsString} from "class-validator";
import {ApiProperty} from "@nestjs/swagger";
import {OptionalBooleanTransform, OptionalNumberTransform} from "../../core/helpers/Transformers";

export class GetObjectsOperStartlijstRequest extends GetObjectsDateRequest {
    // specifieke velden voor GetObjects, zie route.Startlijst.php / class.Startlijst.inc.php GetObjects()
    @IsOptional()
    @OptionalNumberTransform()
    @IsInt()
    @ApiProperty(
        {
            name: 'LID_ID',
            description: 'Opvragen vluchten van een specifiek lid, als vlieger of als inzittende',
            required: false,
            type: Number
        })
    public LID_ID?: number;

    @IsOptional()
    @OptionalNumberTransform()
    @IsInt()
    @ApiProperty(
        {
            name: 'VLIEGTUIG_ID',
            description: 'Opvragen vluchten van een specifiek vliegtuig',
            required: false,
            type: Number
        })
    public VLIEGTUIG_ID?: number;

    @IsOptional()
    @OptionalNumberTransform()
    @IsInt()
    @ApiProperty(
        {
            name: 'STARTMETHODE_ID',
            description: 'Opvragen vluchten met een specifieke startmethode',
            required: false,
            type: Number
        })
    public STARTMETHODE_ID?: number;

    @IsOptional()
    @IsString()
    @ApiProperty(
        {
            name: 'SELECTIE',
            description: 'Zoeken op vlieger-/inzittendenaam of registratie/callsign van het vliegtuig',
            required: false,
            type: String
        })
    public SELECTIE?: string;

    @IsOptional()
    @OptionalBooleanTransform()
    @ApiProperty(
        {
            name: 'OPEN_STARTS',
            description: 'Als "true", dan worden alleen vluchten opgehaald die nog niet geland zijn of geen vlieger hebben',
            required: false,
            type: "boolean"
        })
    public OPEN_STARTS?: boolean;

    @IsOptional()
    @OptionalBooleanTransform()
    @ApiProperty(
        {
            name: 'DDWV',
            description: 'Als "true", dan worden alleen vluchten op DDWV dagen opgehaald',
            required: false,
            type: "boolean"
        })
    public DDWV?: boolean;
}