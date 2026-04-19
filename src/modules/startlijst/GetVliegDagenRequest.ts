import {ApiProperty} from '@nestjs/swagger';
import {IsDate, IsOptional, IsString} from 'class-validator';
import {OptionalDateTransform, OptionalNumberTransform} from '../../core/helpers/Transformers';

export class GetVliegDagenRequest
{
   @IsOptional()
   @IsString()
   @ApiProperty({name: 'SORT', required: false, type: String})
   SORT?: string;

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

   @IsOptional()
   @OptionalNumberTransform()
   @ApiProperty({name: 'LID_ID', required: false, type: Number})
   LID_ID?: number;
}