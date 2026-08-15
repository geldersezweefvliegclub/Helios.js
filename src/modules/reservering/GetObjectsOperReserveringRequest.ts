import {GetObjectsDateRequest} from "../../core/DTO/IHeliosFilter";
import {IsInt, IsOptional} from "class-validator";
import {ApiProperty} from "@nestjs/swagger";
import {OptionalNumberTransform} from "../../core/helpers/Transformers";

export class GetObjectsOperReserveringRequest extends GetObjectsDateRequest {
    // specifieke velden voor GetObjects, zie route.Reservering.php / class.Reservering.inc.php
    @IsOptional()
    @OptionalNumberTransform()
    @IsInt()
    @ApiProperty(
        {
            name: 'LID_ID',
            description: 'Opvragen reserveringen van een specifiek lid',
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
            description: 'Opvragen reserveringen van een specifiek vliegtuig',
            required: false,
            type: Number
        })
    public VLIEGTUIG_ID?: number;
}