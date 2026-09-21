import { ApiProperty } from "@nestjs/swagger";
import {
  IsBoolean,
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
} from "class-validator";

export class CreateOperDienstDto {
  @ApiProperty({
    description: "Het unieke ID van de dienst",
    type: "integer",
    format: "int32",
    default: "autoincrement",
    required: false,
  })
  @IsOptional()
  @IsInt()
  ID?: number;
  @ApiProperty({
    description:
      "Datum van de daginfo. Verplicht bij het aanmaken van een nieuwe dienst, optioneel bij het bijwerken van een bestaand record.",
    type: "string",
    format: "date-time",
  })
  @IsNotEmpty()
  @IsDateString()
  DATUM: Date;
  @ApiProperty({
    description: "Referentie naar het rooster",
    type: "integer",
    format: "int32",
    required: false,
  })
  @IsOptional()
  @IsInt()
  ROOSTER_ID?: number;
  @ApiProperty({
    description:
      "Verwijzing naar het lid ID van diegene die ingeroosterd is, link naar de leden tabel",
    type: "integer",
    format: "int32",
    required: false,
  })
  @IsOptional()
  @IsInt()
  LID_ID?: number;
  @ApiProperty({
    description:
      "Referentie naar het type dienst (startleider, DDI, lierist, etc). Verplicht bij het aanmaken van een nieuwe dienst, optioneel bij het bijwerken van een bestaand record.",
    type: "integer",
    format: "int32",
  })
  @IsNotEmpty()
  @IsInt()
  TYPE_DIENST_ID: number;
  @ApiProperty({
    description: "True als het lid aanwezig was tijdens deze dienst",
    type: "boolean",
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsBoolean()
  AANWEZIG?: boolean | null;
  @ApiProperty({
    description: "True als het lid afwezig was tijdens deze dienst",
    type: "boolean",
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsBoolean()
  AFWEZIG?: boolean | null;
  @ApiProperty({
    description: "Is het record gemarkeerd als verwijderd",
    type: "boolean",
    default: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  VERWIJDERD?: boolean;
  @ApiProperty({
    type: "string",
    format: "date-time",
    required: false,
  })
  @IsOptional()
  @IsDateString()
  LAATSTE_AANPASSING?: Date;
}
