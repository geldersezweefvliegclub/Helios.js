import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean, IsInt, IsOptional, IsString } from "class-validator";

export class UpdateRefCompetentieDto {
  @ApiProperty({
    description:
      "De primary ID van de competentie, andere objecten refereren naar dit ID",
    type: "integer",
    format: "int32",
    default: "autoincrement",
    required: false,
  })
  @IsOptional()
  @IsInt()
  ID?: number;
  @ApiProperty({
    description: "Sorteer volgorde",
    minimum: 0,
    type: "integer",
    format: "int32",
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsInt()
  VOLGORDE?: number | null;
  @ApiProperty({
    description: "Het type vliegtuig, relatie naar de types tabel",
    type: "integer",
    format: "int32",
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsInt()
  LEERFASE_ID?: number | null;
  @ApiProperty({
    description: "Bovenliggende competentie",
    type: "integer",
    format: "int32",
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsInt()
  OUDER_ID?: number | null;
  @ApiProperty({
    description: "Leerblok van de comptentie zoals in de syllabus",
    maxLength: 7,
    type: "string",
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  BLOK?: string | null;
  @ApiProperty({
    description: "Omschrijving van de competentie",
    minLength: 3,
    maxLength: 75,
    type: "string",
    required: false,
  })
  @IsOptional()
  @IsString()
  OMSCHRIJVING?: string;
  @ApiProperty({
    description: "Omschrijving van de competentie",
    maxLength: 75,
    type: "string",
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  DOCUMENTATIE?: string | null;
  @ApiProperty({
    description: "Is deze competentie beperkt geldig",
    type: "boolean",
    default: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  GELDIGHEID?: boolean;
}
