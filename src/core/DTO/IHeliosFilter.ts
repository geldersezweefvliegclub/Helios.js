import {IsInt, IsOptional} from "class-validator";
import {Type} from "class-transformer";
import {
   OptionalBooleanTransform,
   OptionalNumberTransform,
   CSVTransform,
   OptionalDateTransform
} from "../helpers/Transformers";
import {ApiProperty} from "@nestjs/swagger";

// class as query parameter to get a single object
export class GetObjectRequest
{
   @IsInt()
   @Type(() => Number)
   @ApiProperty(
      {
         name: 'ID',
         required: true,
         type: Number
      })
   public ID: number;
}

// base class as query parameter to get multiple objects via the GetObjects call
export class GetObjectsRequest
{
   @IsOptional()
   @OptionalNumberTransform()
   @ApiProperty(
      {
         name: 'ID',
         description: 'Enkel ID ophalen',
         required: false,
         type: Number
      })
   public ID?: number;

   @IsOptional()
   @CSVTransform()
   @ApiProperty(
      {
         name: 'IDs',
         description: 'Comma separated lijst van IDs',
         required: false,
         type: String
      })
   public IDs?: number[];

   @IsOptional()
   @OptionalBooleanTransform()
   @ApiProperty(
      {
         name: 'VERWIJDERD',
         description: 'Als "true", dan worden alleen de verwijderde records opgehaald',
         required: false,
         type: Boolean
      })
   public VERWIJDERD?: boolean;

   @IsOptional()
   @ApiProperty(
      {
         name: 'HASH',
         description: 'Hash van de data. Als de hash hetzelfde is als de hash van de data, dan is komt HTTP 304 terug.',
         required: false,
         type: String
      })
   public HASH?: string;

   @IsOptional()
   @IsOptional()
   @ApiProperty(
      {
         name: 'SORT',
         description: 'Sorteer volgorde als CSV lijst. Bijvoorbeeld: "LIDTYPE, ID DESC"',
         required: false,
         type: String
      })
   public SORT?: string;

   @IsOptional()
   @OptionalNumberTransform()
   @ApiProperty(
      {
         name: 'MAX',
         description: 'Maximaal aantal records',
         required: false,
         type: Number
      })
   public MAX?: number;

   @IsOptional()
   @OptionalNumberTransform()
   @ApiProperty(
      {
         name: 'START',
         description: 'Start record',
         required: false,
         type: Number
      })
   public START?: number;

   @IsOptional()
   @ApiProperty(
      {
         name: 'VELDEN',
         description: 'Comma separated lijst van velden die opgehaald moeten worden',
         required: false,
         type: String
      })
   public VELDEN?: string;
}

// The generic class when a DATUM field is available in the object
export class GetObjectsDateRequest extends GetObjectsRequest
{
   @IsOptional()
   @OptionalDateTransform()
   @ApiProperty(
      {
         name: 'DATUM',
         required: false,
         type: Date
      })
   public DATUM?: Date;

   @IsOptional()
   @OptionalDateTransform()
   @ApiProperty(
      {
         name: 'BEGIN_DATUM',
         required: false,
         type: Date
      })
   public BEGIN_DATUM?: Date;

   @IsOptional()
   @OptionalDateTransform()
   @ApiProperty(
      {
         name: 'EIND_DATUM',
         required: false,
         type: Date
      })
   public EIND_DATUM?: Date;
}

