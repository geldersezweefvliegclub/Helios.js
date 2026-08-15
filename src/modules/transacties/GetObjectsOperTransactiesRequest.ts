import {GetObjectsDateRequest } from "../../core/DTO/IHeliosFilter";
import {IsDate, IsInt, IsOptional} from "class-validator";
import {OptionalDateTransform, OptionalNumberTransform} from "../../core/helpers/Transformers";
import {ApiProperty} from "@nestjs/swagger";


export class GetObjectsOperTransactiesRequest extends GetObjectsDateRequest
{
   // specifieke velden voor GetObjects
    @IsOptional()
    @OptionalNumberTransform()
    @IsInt()
    @ApiProperty(
        {
            name: "LID_ID",
            required: false,
            description: 'Opvragen documenten van een specifiek lid',
            type: Number
        })
    LID_ID?: number;

    @IsOptional()
    @ApiProperty(
        {
            required: false,
            description: 'Referentie naar een extern systeem, bijv Mollie of e-boekhouden',
            type: String
        })
    EXT_REF?: string;

    @IsOptional()
    @IsDate()
    @OptionalDateTransform()
    @ApiProperty(
        {
            required: false,
            description: 'Enkel transacties van deze vliegdag (DDWV)',
            type: Date
        })
    VLIEGDAG?: Date;
}

