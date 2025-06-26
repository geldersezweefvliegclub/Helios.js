import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean, IsInt, IsOptional, IsString } from "class-validator";

export class CreateHeliosDocumentDto {
  @ApiProperty({
    description: "Het unieke ID van een document",
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
    description: "Documenten worden gegroepeerd",
    type: "integer",
    format: "int32",
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsInt()
  GROEP_ID?: number | null;
  @ApiProperty({
    description: "Beschrijving van het document",
    minLength: 4,
    type: "string",
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  TEKST?: string | null;
  @ApiProperty({
    description: "Link naar het document",
    type: "string",
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  URL?: string | null;
  @ApiProperty({
    description: "Document behoort bij een lid, bijv kopie medical, brevet",
    type: "integer",
    format: "int32",
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsInt()
  LID_ID?: number | null;
  @ApiProperty({
    description: "Lege regel om paragraaf te kunnen maken",
    type: "boolean",
    default: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  LEGE_REGEL?: boolean;
  @ApiProperty({
    description: "Plaats een horizontale lijn",
    type: "boolean",
    default: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  ONDERSTREEP?: boolean;
  @ApiProperty({
    description:
      "Plaats een horizontale lijn aan de bovenkant (true) / onderkant (false)",
    type: "boolean",
    default: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  BOVEN?: boolean;
}
