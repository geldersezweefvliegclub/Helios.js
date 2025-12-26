import { ApiProperty } from "@nestjs/swagger";
import { IsDateString, IsInt, IsOptional } from "class-validator";

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
    description: "Datum van de daginfo",
    type: "string",
    format: "date-time",
    required: false,
  })
  @IsOptional()
  @IsDateString()
  DATUM?: Date;
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
      "Referentie naar hettype dienst (startleider, DDI, lietrist, etc)",
    type: "integer",
    format: "int32",
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsInt()
  TYPE_DIENST_ID?: number | null;
  @ApiProperty({
    description:
      "Verwijzing naar het lid ID van de instructeur die rapport geschreven heeft, link naar de leden tabel",
    type: "integer",
    format: "int32",
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsInt()
  INGEVOERD_DOOR_ID?: number | null;
  @ApiProperty({
    description: "True als het lid aanwezig was tijdens deze dienst",
    type: "integer",
    format: "int32",
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsInt()
  AANWEZIG?: number | null;
  @ApiProperty({
    description: "True als het lid afwezig was tijdens deze dienst",
    type: "integer",
    format: "int32",
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsInt()
  AFWEZIG?: number | null;
}
