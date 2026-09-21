import {GetObjectsRequest} from "../../core/DTO/IHeliosFilter";
import {IsOptional} from "class-validator";
import {ApiProperty} from "@nestjs/swagger";
import {CSVTransform} from "../../core/helpers/Transformers";

export class GetObjectsHeliosDocumentenRequest extends GetObjectsRequest {
    // hier komen de specifieke velden voor GetObjects
    @IsOptional()
    @CSVTransform()
    @ApiProperty(
        {
            name: "LID_ID",
            required: false,
            description: 'CSV lijst van lid IDs om documenten van op te halen. Niet meegeven filtert op documenten zonder gekoppeld lid',
            type: String
        })
    LID_ID?: number[];

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

