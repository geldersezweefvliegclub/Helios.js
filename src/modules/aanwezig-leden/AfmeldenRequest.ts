import {ApiProperty} from "@nestjs/swagger";
import {IsInt, IsNotEmpty, IsOptional, IsString} from "class-validator";

// body voor AanwezigLeden/Afmelden - het lid moet al aangemeld zijn, anders volgt een 409
export class AfmeldenRequest
{
   @ApiProperty({type: "integer", format: "int32", required: false, description: "ID van de aanmelding, indien bekend"})
   @IsOptional()
   @IsInt()
   ID?: number;

   @ApiProperty({type: "integer", format: "int32", description: "Lid dat zich afmeldt"})
   @IsNotEmpty()
   @IsInt()
   LID_ID: number;

   @ApiProperty({type: "string", format: "date-time", required: false, nullable: true})
   @IsOptional()
   @IsString()
   VERTREK?: Date | string | null;
}
