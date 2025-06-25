import { ApiProperty } from "@nestjs/swagger";
import {
  IsBoolean,
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
} from "class-validator";

export class UpdateOperAanwezigLidDto {
  @ApiProperty({
    description: "Het unieke ID van de aanmelding",
    type: "integer",
    format: "int32",
    default: "autoincrement",
    required: false,
  })
  @IsOptional()
  @IsInt()
  ID?: number;
  @ApiProperty({
    description: "Datum van het dagrapport",
    type: "string",
    format: "date-time",
    required: false,
  })
  @IsOptional()
  @IsDateString()
  DATUM?: Date;
  @ApiProperty({
    description:
      "Verwijzing naar het lid ID van de persoon die gewerkt heeft, link naar de leden tabel",
    type: "integer",
    format: "int32",
    required: false,
  })
  @IsOptional()
  @IsInt()
  LID_ID?: number;
  @ApiProperty({
    description: "Referentie naar het veld in de type tabel",
    type: "integer",
    format: "int32",
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsInt()
  VELD_ID?: number | null;
  @ApiProperty({
    description:
      "Is er vooraf aangemeld? Of is de aanmelding gedaan bij het starten van de vlucht?",
    type: "boolean",
    default: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  VOORAANMELDING?: boolean;
  @ApiProperty({
    description: "Tijd van aanwezig zijn (niet de tijd van de aanmelding)",
    type: "string",
    format: "date-time",
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsDateString()
  AANKOMST?: Date | null;
  @ApiProperty({
    description: "Vertrek tijd, de tijd dat de persoon vertrekt van het veld",
    type: "string",
    format: "date-time",
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsDateString()
  VERTREK?: Date | null;
  @ApiProperty({
    description: "Referentie naar het veld in de type tabel",
    type: "integer",
    format: "int32",
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsInt()
  OVERLAND_VLIEGTUIG_ID?: number | null;
  @ApiProperty({
    description:
      "Comma-separated lijst van de vliegtuigen types waarop het lid graag wil vliegen",
    type: "string",
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  VOORKEUR_VLIEGTUIG_TYPE?: string | null;
  @ApiProperty({
    description:
      "Referentie naar de transactie als dat van toepassing is (bijv DDVD)",
    type: "integer",
    format: "int32",
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsInt()
  TRANSACTIE_ID?: number | null;
  @ApiProperty({
    description: "Eventuele opmerkingen, zoals eerder weg gaan",
    type: "string",
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  OPMERKINGEN?: string | null;
}
