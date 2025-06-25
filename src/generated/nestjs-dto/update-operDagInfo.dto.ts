import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean, IsDateString, IsInt, IsOptional } from "class-validator";

export class UpdateOperDagInfoDto {
  @ApiProperty({
    description: "Het unieke ID van de daginfo",
    type: "integer",
    format: "int32",
    default: "autoincrement",
    required: false,
  })
  @IsOptional()
  @IsInt()
  ID?: number;
  @ApiProperty({
    description: "Datum van de daginfo",
    type: "string",
    format: "date-time",
    default: new Date().toISOString(),
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsDateString()
  DATUM?: Date | null;
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
    description: "Referentie naar de baan in de type tabel",
    type: "integer",
    format: "int32",
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsInt()
  BAAN_ID?: number | null;
  @ApiProperty({
    description: "Referentie naar de startmethode in de type tabel",
    type: "integer",
    format: "int32",
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsInt()
  STARTMETHODE_ID?: number | null;
  @ApiProperty({
    description: "Referentie naar het veld in de type tabel",
    type: "integer",
    format: "int32",
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsInt()
  VELD_ID2?: number | null;
  @ApiProperty({
    description: "Referentie naar de baan in de type tabel",
    type: "integer",
    format: "int32",
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsInt()
  BAAN_ID2?: number | null;
  @ApiProperty({
    description: "Referentie naar de startmethode in de type tabel",
    type: "integer",
    format: "int32",
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsInt()
  STARTMETHODE_ID2?: number | null;
  @ApiProperty({
    description: "Is het een clubbedrijf",
    type: "boolean",
    default: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  CLUB_BEDRIJF?: boolean;
  @ApiProperty({
    description: "Is het een DDWV bedrijf",
    type: "boolean",
    default: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  DDWV?: boolean;
}
