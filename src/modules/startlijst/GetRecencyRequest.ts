import {ApiProperty} from '@nestjs/swagger';
import {IsDate, IsOptional} from 'class-validator';
import {OptionalDateTransform, OptionalNumberTransform} from '../../core/helpers/Transformers';

export class GetRecencyRequest
{
   @OptionalNumberTransform()
   @ApiProperty({name: 'VLIEGER_ID', required: true, type: Number})
   VLIEGER_ID: number;

   @IsOptional()
   @IsDate()
   @OptionalDateTransform()
   @ApiProperty({name: 'DATUM', required: false, type: Date})
   DATUM?: Date;
}