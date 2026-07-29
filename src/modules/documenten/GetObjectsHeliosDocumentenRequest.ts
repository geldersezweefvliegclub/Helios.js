import {GetObjectsRequest} from "../../core/DTO/IHeliosFilter";
import {IsInt, IsOptional} from "class-validator";
import {ApiProperty} from "@nestjs/swagger";
import {CSVTransform, OptionalNumberTransform} from "../../core/helpers/Transformers";

export class GetObjectsHeliosDocumentenRequest extends GetObjectsRequest {
    // hier komen de specifieke velden voor GetObjects
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
    @CSVTransform()
    @ApiProperty(
        {
            required: false,
            description: 'CSV lijst van groep IDs om documenten uit op te halen',
            type: String
        })
    GROEPEN?: number[];
}

