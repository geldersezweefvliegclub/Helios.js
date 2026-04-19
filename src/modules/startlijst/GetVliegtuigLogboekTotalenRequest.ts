import {ApiProperty} from '@nestjs/swagger';
import {IsOptional} from 'class-validator';
import {OptionalNumberTransform} from '../../core/helpers/Transformers';

export class GetVliegtuigLogboekTotalenRequest
{
   @IsOptional()
   @OptionalNumberTransform()
   @ApiProperty({name: 'ID', required: false, type: Number})
   ID?: number;

   @IsOptional()
   @OptionalNumberTransform()
   @ApiProperty({name: 'JAAR', required: false, type: Number})
   JAAR?: number;
}