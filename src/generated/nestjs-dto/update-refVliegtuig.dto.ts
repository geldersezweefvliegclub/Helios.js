import { ApiProperty } from "@nestjs/swagger";
import { IsInt, IsOptional, IsString } from "class-validator";

export class UpdateRefVliegtuigDto {
  @ApiProperty({
    description:
      "De primary ID van het vliegtuig, andere objecten refereren naar dit ID",
    type: "integer",
    format: "int32",
    default: "autoincrement",
    required: false,
  })
  @IsOptional()
  @IsInt()
  ID?: number;
  @ApiProperty({
    description: "Registratie van het vliegtuig",
    minLength: 4,
    maxLength: 8,
    type: "string",
    required: false,
  })
  @IsOptional()
  @IsString()
  REGISTRATIE?: string;
  @ApiProperty({
    description: "Callsign van het vliegtuig",
    maxLength: 6,
    type: "string",
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  CALLSIGN?: string | null;
  @ApiProperty({
    description: "Aantal zitplaatsen in het vliegtuig",
    minimum: 1,
    maximum: 2,
    type: "integer",
    format: "int32",
    default: 1,
    required: false,
  })
  @IsOptional()
  @IsInt()
  ZITPLAATSEN?: number;
  @ApiProperty({
    description: "Is het vliegtuig eigendom van de club",
    type: "integer",
    format: "int32",
    default: 0,
    required: false,
  })
  @IsOptional()
  @IsInt()
  CLUBKIST?: number;
  @ApiProperty({
    description:
      "Flarmcode van het vliegtuig. Indien meerdere codes, dan CSV met comma's als scheidingsteken",
    maxLength: 50,
    type: "string",
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  FLARMCODE?: string | null;
  @ApiProperty({
    description: "Het type vliegtuig, relatie naar de types tabel",
    type: "integer",
    format: "int32",
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsInt()
  TYPE_ID?: number | null;
  @ApiProperty({
    description: "Is het een Touring Motor Glider (TMG)",
    type: "integer",
    format: "int32",
    default: 0,
    required: false,
  })
  @IsOptional()
  @IsInt()
  TMG?: number;
  @ApiProperty({
    description: "Kan het vliegtuig zelfstarten",
    type: "integer",
    format: "int32",
    default: 0,
    required: false,
  })
  @IsOptional()
  @IsInt()
  ZELFSTART?: number;
  @ApiProperty({
    description: "Is het een motorvliegtuig die sleept",
    type: "integer",
    format: "int32",
    default: 0,
    required: false,
  })
  @IsOptional()
  @IsInt()
  SLEEPKIST?: number;
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
    description: "Is het vliegtuig inzetbaar in het vliegbedrijf",
    type: "integer",
    format: "int32",
    default: 1,
    required: false,
  })
  @IsOptional()
  @IsInt()
  INZETBAAR?: number;
  @ApiProperty({
    description: "Is het vliegtuig een instructievliegtuig",
    type: "integer",
    format: "int32",
    default: 0,
    required: false,
  })
  @IsOptional()
  @IsInt()
  TRAINER?: number;
  @ApiProperty({
    description: "De URL naar de handleiding van het vliegtuig",
    maxLength: 1024,
    type: "string",
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  URL?: string | null;
  @ApiProperty({
    description: "Opmerkingen over het vliegtuig",
    type: "string",
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  OPMERKINGEN?: string | null;
}
