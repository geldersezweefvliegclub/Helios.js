import { Prisma } from "@prisma/client";
import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean, IsDateString, IsDecimal, IsInt, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreateOperAanwezigVliegtuigDto {
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
  })
  @IsNotEmpty()
  @IsDateString()
  DATUM: Date;
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
    description: "Tijd van aanwezig zijn (niet de tijd van de aanmelding)",
    type: "string",
    format: "date-time",
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString()
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
  @IsString()
  VERTREK?: Date | null;
  @ApiProperty({
    description: "Laaste bekende Latitude van het vliegtuig",
    type: "string",
    format: "Decimal.js",
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsDecimal()
  LATITUDE?: Prisma.Decimal | null;
  @ApiProperty({
    description: "Laaste bekende Longitude van het vliegtuig",
    type: "string",
    format: "Decimal.js",
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsDecimal()
  LONGITUDE?: Prisma.Decimal | null;
  @ApiProperty({
    description: "Laaste bekende hoogte van het vliegtuig in meters",
    type: "integer",
    format: "int32",
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsInt()
  HOOGTE?: number | null;
  @ApiProperty({
    description: "Laaste bekende grond snelheid van het vliegtuig in km/h",
    type: "integer",
    format: "int32",
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsInt()
  SNELHEID?: number | null;
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
    description: "Is het record gemarkeerd als verwijderd",
    type: "boolean",
    default: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  VERWIJDERD?: boolean;
  @ApiProperty({
    description: "Tijdstempel met de laatste wijziging van het record",
    type: "string",
    format: "date-time",
    required: false,
  })
  @IsOptional()
  @IsDateString()
  LAATSTE_AANPASSING?: Date;
}
