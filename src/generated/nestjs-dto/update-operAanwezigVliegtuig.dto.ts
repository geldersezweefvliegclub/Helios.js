import { ApiProperty } from "@nestjs/swagger";
import { IsDateString, IsInt, IsNumber, IsOptional } from "class-validator";

export class UpdateOperAanwezigVliegtuigDto {
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
    description: "Datum van de aanmelding",
    type: "string",
    format: "date-time",
    required: false,
  })
  @IsOptional()
  @IsDateString()
  DATUM?: Date;
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
  })
  @IsOptional()
  @IsInt()
  VLIEGTUIG_ID?: number;
  @ApiProperty({
    description: "Laaste bekende Latitude van het vliegtuig",
    type: "number",
    format: "float",
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsNumber()
  LATITUDE?: number | null;
  @ApiProperty({
    description: "Laaste bekende Longitude van het vliegtuig",
    type: "number",
    format: "float",
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsNumber()
  LONGITUDE?: number | null;
  @ApiProperty({
    description: "Laaste bekende hoogte van het vliegtuig in meters",
    type: "number",
    format: "float",
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsNumber()
  HOOGTE?: number | null;
  @ApiProperty({
    description: "Laaste bekende grond snelheid van het vliegtuig in km/h",
    type: "number",
    format: "float",
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsNumber()
  SNELHEID?: number | null;
}
