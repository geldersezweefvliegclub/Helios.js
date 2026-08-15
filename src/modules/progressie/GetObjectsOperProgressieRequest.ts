import {GetObjectsRequest} from "../../core/DTO/IHeliosFilter";
import {IsInt, IsOptional} from "class-validator";
import {ApiProperty} from "@nestjs/swagger";
import {CSVTransform, OptionalNumberTransform} from "../../core/helpers/Transformers";

export class GetObjectsOperProgressieRequest extends GetObjectsRequest {
    // specifieke velden voor GetObjects, zie route.Progressie.php / class.Progressie.inc.php GetObjects()
    @IsOptional()
    @OptionalNumberTransform()
    @IsInt()
    @ApiProperty(
        {
            name: 'LID_ID',
            description: 'Opvragen progressie van een specifiek lid',
            required: false,
            type: Number
        })
    public LID_ID?: number;

    @IsOptional()
    @OptionalNumberTransform()
    @IsInt()
    @ApiProperty(
        {
            name: 'INSTRUCTEUR_ID',
            description: 'Opvragen progressie afgetekend door een specifieke instructeur',
            required: false,
            type: Number
        })
    public INSTRUCTEUR_ID?: number;

    @IsOptional()
    @CSVTransform()
    @ApiProperty(
        {
            name: 'IN',
            description: 'CSV lijst van competentie IDs om progressie van op te halen',
            required: false,
            type: String
        })
    public IN?: number[];
}
