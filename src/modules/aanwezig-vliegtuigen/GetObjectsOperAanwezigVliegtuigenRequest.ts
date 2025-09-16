import {GetObjectsDateRequest } from "../../core/DTO/IHeliosFilter";
import {IsOptional} from "class-validator";
import {OptionalBooleanTransform} from "../../core/helpers/Transformers";
import {ApiProperty} from "@nestjs/swagger";


export class GetObjectsOperAanwezigVliegtuigenRequest extends GetObjectsDateRequest
{
   // specifieke velden voor GetObjects
    @IsOptional()
    @OptionalBooleanTransform()
    @ApiProperty(
        {
            required: false,
            description: 'Als "true", dan worden alleen niet vertrokken vliegtuigen opgehaald',
            type: "boolean"
        })
    public NIET_VERTROKKEN? : boolean;
}

