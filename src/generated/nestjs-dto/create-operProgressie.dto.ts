import { ApiProperty } from "@nestjs/swagger";
import {
  IsBoolean,
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
} from "class-validator";

export class CreateOperProgressieDto {
  @ApiProperty({
    description: "Het unieke ID van een progressie",
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
      "Verwijzing naar het lid die de competentie gehaald heeft, link naar de leden tabel",
    type: "integer",
    format: "int32",
    required: false,
  })
  @IsOptional()
  @IsInt()
  LID_ID?: number;
  @ApiProperty({
    description: "Verwijzing naar de competentie die het lid gehaald heeft",
    type: "integer",
    format: "int32",
    required: false,
  })
  @IsOptional()
  @IsInt()
  COMPETENTIE_ID?: number;
  @ApiProperty({
    description:
      "Verwijzing naar de instructeur die de progressie heeft afgetekend, link naar de leden tabel",
    type: "integer",
    format: "int32",
    required: false,
  })
  @IsOptional()
  @IsInt()
  INSTRUCTEUR_ID?: number;
  @ApiProperty({
    description: "Opmerkingen bij de progressie",
    type: "string",
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  OPMERKINGEN?: string | null;
  @ApiProperty({
    description: "Tijdstempel wanneer de progressie is afgetekend",
    type: "string",
    format: "date-time",
    default: new Date().toISOString(),
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsDateString()
  INGEVOERD?: Date | null;
  @ApiProperty({
    description: "TODO",
    type: "integer",
    format: "int32",
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsInt()
  LINK_ID?: number | null;
  @ApiProperty({
    description:
      "Tot wanneer is de progressie geldig (Bijv theorie certificaat)",
    type: "string",
    format: "date-time",
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsDateString()
  GELDIG_TOT?: Date | null;
  @ApiProperty({
    description: "Hoe ver is de progessie gevorderd? (1=basis,5 =volledig)",
    minimum: 1,
    maximum: 5,
    type: "integer",
    format: "int32",
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsInt()
  SCORE?: number | null;
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
