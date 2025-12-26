import { ApiProperty } from "@nestjs/swagger";
import { IsDateString, IsInt, IsOptional, IsString } from "class-validator";

export class CreateOperReserveringDto {
  @ApiProperty({
    description: "Het unieke ID van een reservering",
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
      "Datum waarvoor een persoon een vliegtuig heeft gereserveerd (niet de datum van invoer)",
    type: "string",
    format: "date-time",
    required: false,
  })
  @IsOptional()
  @IsDateString()
  DATUM?: Date;
  @ApiProperty({
    description: "Verwijzing naar het vliegtuig dat gereserveerd is",
    type: "integer",
    format: "int32",
    required: false,
  })
  @IsOptional()
  @IsInt()
  VLIEGTUIG_ID?: number;
  @ApiProperty({
    description: "Verwijzing naar het lid die de reservering heeft gemaakt",
    type: "integer",
    format: "int32",
    required: false,
  })
  @IsOptional()
  @IsInt()
  LID_ID?: number;
  @ApiProperty({
    description: "Tijdstip wanneer de reservering is ingevoerd",
    type: "integer",
    format: "int32",
    required: false,
  })
  @IsOptional()
  @IsInt()
  INGEVOERD_ID?: number;
  @ApiProperty({
    description:
      "Is kist geboekt voor een langere periode. Toekenning door beheerder",
    type: "integer",
    format: "int32",
    default: 0,
    required: false,
  })
  @IsOptional()
  @IsInt()
  IS_GEBOEKT?: number;
  @ApiProperty({
    description: "Eventuele opmerkingen bij de reservering",
    type: "string",
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  OPMERKINGEN?: string | null;
}
