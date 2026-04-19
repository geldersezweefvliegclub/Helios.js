import {ApiProperty} from '@nestjs/swagger';
import {IsOptional} from 'class-validator';
import {OptionalNumberTransform} from '../../core/helpers/Transformers';

export class GetLogboekTotalenRequest
{
   @IsOptional()
   @OptionalNumberTransform()
   @ApiProperty({name: 'JAAR', required: false, type: Number})
   JAAR?: number;

   @IsOptional()
   @OptionalNumberTransform()
   @ApiProperty({name: 'LID_ID', required: false, type: Number})
   LID_ID?: number;
}