import {GetObjectsRequest} from "../../core/DTO/IHeliosFilter";
import {IsInt, IsOptional} from "class-validator";
import {ApiProperty} from "@nestjs/swagger";
import {OptionalNumberTransform} from "../../core/helpers/Transformers";

export class GetObjectsOperTracksRequest extends GetObjectsRequest {
    // specifieke velden voor GetObjects, zie route.Tracks.php / class.Tracks.inc.php
    @IsOptional()
    @OptionalNumberTransform()
    @IsInt()
    @ApiProperty(
        {
            name: 'LID_ID',
            description: 'Opvragen tracks van een specifiek lid',
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
            description: 'Opvragen tracks van een specifieke instructeur',
            required: false,
            type: Number
        })
    public INSTRUCTEUR_ID?: number;
}