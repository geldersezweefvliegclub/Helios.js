import { ApiProperty } from "@nestjs/swagger";
import { IsDateString, IsInt, IsOptional, IsString } from "class-validator";

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
    description: "Datum waarop het lid aanwezig is / zal zijn",
    type: "string",
    format: "date-time",
    required: false,
  })
  @IsOptional()
  @IsDateString()
  DATUM?: Date;
  @ApiProperty({
    type: "integer",
    format: "int32",
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsInt()
  POSITIE?: number | null;
  @ApiProperty({
    description:
      "Verwijzing naar het lid ID van de vlieger, link naar de leden tabel",
    type: "integer",
    format: "int32",
    required: false,
  })
  @IsOptional()
  @IsInt()
  LID_ID?: number;
  @ApiProperty({
    description:
      "Is er vooraf aangemeld (true)? Of is de aanmelding gedaan bij het starten van de vlucht (false)?",
    type: "integer",
    format: "int32",
    default: 0,
    required: false,
  })
  @IsOptional()
  @IsInt()
  VOORAANMELDING?: number;
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
    description:
      "Vertrek tijd, de tijd dat de persoon vertrekt van het veld en naar huis gaat",
    type: "string",
    format: "date-time",
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsDateString()
  VERTREK?: Date | null;
  @ApiProperty({
    description: "Referentie naar het vliegtuig in de vliegtuigen tabel",
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
    description: "Referentie naar het vliegveld in de type tabel",
    type: "integer",
    format: "int32",
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsInt()
  VELD_ID?: number | null;
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
