import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean, IsInt, IsOptional, IsString } from "class-validator";

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
    type: "boolean",
    default: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  CLUBKIST?: boolean;
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
    description: "Kan het vliegtuig zelfstarten",
    type: "boolean",
    default: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  ZELFSTART?: boolean;
  @ApiProperty({
    description: "Is het een Touring Motor Glider (TMG)",
    type: "boolean",
    default: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  TMG?: boolean;
  @ApiProperty({
    description: "Is het een motorvliegtuig die sleept",
    type: "boolean",
    default: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  SLEEPKIST?: boolean;
  @ApiProperty({
    description: "Is het vliegtuig inzetbaar in het vliegbedrijf",
    type: "boolean",
    default: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  INZETBAAR?: boolean;
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
    description: "Is het vliegtuig een instructievliegtuig",
    type: "boolean",
    default: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  TRAINER?: boolean;
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
