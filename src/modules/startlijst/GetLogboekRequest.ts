import {ApiProperty, OmitType} from '@nestjs/swagger';
import {IsDate, IsOptional, IsString} from 'class-validator';
import {GetObjectsRequest} from '../../core/DTO/IHeliosFilter';
import {OptionalDateTransform, OptionalNumberTransform} from '../../core/helpers/Transformers';

export class GetLogboekRequest extends OmitType(GetObjectsRequest, ['HASH'] as const)
{
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