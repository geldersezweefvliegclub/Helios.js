import {ApiProperty} from "@nestjs/swagger";
import {IsInt, IsNotEmpty, IsOptional, IsString} from "class-validator";

// body voor AanwezigVliegtuigen/Afmelden - het vliegtuig moet al aangemeld zijn, anders volgt een 409,
// zie AanwezigVliegtuigen.Afmelden() in de PHP implementatie
export class AfmeldenVliegtuigRequest
{
   @ApiProperty({type: "integer", format: "int32", required: false, description: "ID van de aanmelding, indien bekend"})
   @IsOptional()
   @IsInt()
   ID?: number;

   @ApiProperty({type: "integer", format: "int32", description: "Vliegtuig dat wordt afgemeld"})
   @IsNotEmpty()
   @IsInt()
   VLIEGTUIG_ID: number;

   @ApiProperty({type: "string", format: "date-time", required: false, nullable: true})
   @IsOptional()
   @IsString()
   VERTREK?: Date | string | null;
}
