import {GetObjectsDateRequest } from "../../core/DTO/IHeliosFilter";
import {IsInt, IsOptional} from "class-validator";
import {OptionalNumberTransform} from "../../core/helpers/Transformers";
import {ApiProperty} from "@nestjs/swagger";


export class GetObjectsOperDienstenRequest extends GetObjectsDateRequest
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
}

