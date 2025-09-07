import { ApiProperty } from "@nestjs/swagger";
import { IsDateString, IsInt, IsOptional, IsString } from "class-validator";

export class UpdateOperProgressieDto {
  @ApiProperty({
    description: "Het unieke ID van een factuur",
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
    description: "Verwijzing naar de competentie die het lid gehaald heeft",
    type: "integer",
    format: "int32",
    required: false,
  })
  @IsOptional()
  @IsInt()
  COMPETENTIE_ID?: number;
  @ApiProperty({
    description: "Tijdstempel wanneer de progressie is afgetekend",
    type: "string",
    format: "date-time",
    default: new Date().toISOString(),
    required: false,
  })
  @IsOptional()
  @IsDateString()
  INGEVOERD?: Date;
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
    description: "Omschrijving van de factuurregel",
    type: "string",
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  OPMERKINGEN?: string | null;
}
