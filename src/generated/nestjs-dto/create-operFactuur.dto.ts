import { ApiProperty } from "@nestjs/swagger";
import { IsInt, IsNumber, IsOptional, IsString } from "class-validator";

export class CreateOperFactuurDto {
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
    description: "Jaar van het lidmaatschap",
    minimum: 2025,
    type: "integer",
    format: "int32",
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsInt()
  JAAR?: number | null;
  @ApiProperty({
    description:
      "Verwijzing naar het lid ID die de factuur ontvangt, link naar de leden tabel",
    type: "integer",
    format: "int32",
    required: false,
  })
  @IsOptional()
  @IsInt()
  LID_ID?: number;
  @ApiProperty({
    description:
      "Het lidnummer zoals dat in de financiele administratie wordt gebruikt",
    maxLength: 10,
    type: "string",
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  LIDNR?: string | null;
  @ApiProperty({
    description: "Het factuurnummer zoals dat door de boekhouding is toegekend",
    maxLength: 10,
    type: "string",
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  FACTUUR_NUMMER?: string | null;
  @ApiProperty({
    description: "Lidmaatschapscode",
    maxLength: 10,
    type: "string",
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  CODE?: string | null;
  @ApiProperty({
    description: "Omschrijving van de factuurregel",
    type: "string",
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  OMSCHRIJVING?: string | null;
  @ApiProperty({
    description: "Bedrag wat gefactureerd is",
    type: "number",
    format: "float",
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsNumber()
  GEFACTUREERD?: number | null;
}
