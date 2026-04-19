import {ApiProperty} from '@nestjs/swagger';
import {IsDate, IsOptional} from 'class-validator';
import {OptionalBooleanTransform, OptionalDateTransform, OptionalNumberTransform} from '../../core/helpers/Transformers';

export class GetVliegtuigLogboekRequest
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
   @ApiProperty({name: 'START', required: false, type: Number})
   START?: number;

   @IsOptional()
   @OptionalNumberTransform()
   @ApiProperty({name: 'MAX', required: false, type: Number})
   MAX?: number;

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
}