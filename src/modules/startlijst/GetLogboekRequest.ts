import {ApiProperty} from '@nestjs/swagger';
import {IsDate, IsOptional, IsString} from 'class-validator';
import {GetObjectsRequest} from '../../core/DTO/IHeliosFilter';
import {OptionalBooleanTransform, OptionalDateTransform, OptionalNumberTransform} from '../../core/helpers/Transformers';

export class GetLogboekRequest extends GetObjectsRequest
{
   @IsOptional()
   @OptionalBooleanTransform()
   @ApiProperty({name: 'LAATSTE_AANPASSING', required: false, type: Boolean})
   LAATSTE_AANPASSING?: boolean;

   @IsOptional()
   @IsDate()
   @OptionalDateTransform()
   @ApiProperty({name: 'BEGIN_DATUM', required: false, type: Date})
   BEGIN_DATUM?: Date;

   @IsOptional()
   @IsDate()
   @OptionalDateTransform()
   @ApiProperty({name: 'EIND_DATUM', required: false, type: Date})
   EIND_DATUM?: Date;

   @IsOptional()
   @OptionalNumberTransform()
   @ApiProperty({name: 'LID_ID', required: false, type: Number})
   LID_ID?: number;

   @IsOptional()
   @OptionalNumberTransform()
   @ApiProperty({name: 'VLIEGTUIG_ID', required: false, type: Number})
   VLIEGTUIG_ID?: number;

   @IsOptional()
   @OptionalNumberTransform()
   @ApiProperty({name: 'JAAR', required: false, type: Number})
   JAAR?: number;

   @IsOptional()
   @IsString()
   @ApiProperty({name: 'SORT', required: false, type: String})
   override SORT?: string;
}