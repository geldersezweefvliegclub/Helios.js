import {ApiProperty} from '@nestjs/swagger';
import {IsOptional} from 'class-validator';
import {OptionalBooleanTransform, OptionalNumberTransform} from '../../core/helpers/Transformers';

export class GetVliegtuigLogboekTotalenRequest
{
   @IsOptional()
   @OptionalNumberTransform()
   @ApiProperty({name: 'ID', required: false, type: Number})
   ID?: number;

   @IsOptional()
   @OptionalBooleanTransform()
   @ApiProperty({name: 'LAATSTE_AANPASSING', required: false, type: Boolean})
   LAATSTE_AANPASSING?: boolean;

   @IsOptional()
   @ApiProperty({name: 'HASH', required: false, type: String})
   HASH?: string;

   @IsOptional()
   @OptionalNumberTransform()
   @ApiProperty({name: 'JAAR', required: false, type: Number})
   JAAR?: number;
}