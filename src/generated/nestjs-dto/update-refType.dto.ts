import { Prisma } from "@prisma/client";
import { ApiProperty } from "@nestjs/swagger";
import {
  IsBoolean,
  IsDecimal,
  IsInt,
  IsOptional,
  IsString,
} from "class-validator";

export class UpdateRefTypeDto {
  @ApiProperty({
    description:
      "De primary ID van het type, andere objecten refereren naar dit ID",
    type: "integer",
    format: "int32",
    default: "autoincrement",
    required: false,
  })
  @IsOptional()
  @IsInt()
  ID?: number;
  @ApiProperty({
    description: "Verwijzing naar de RefTypesGroepen",
    type: "integer",
    format: "int32",
    required: false,
  })
  @IsOptional()
  @IsInt()
  TYPEGROEP_ID?: number;
  @ApiProperty({
    description: "De code van dit type",
    maxLength: 10,
    type: "string",
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  CODE?: string | null;
  @ApiProperty({
    description: "De externe referentie van dit type",
    maxLength: 25,
    type: "string",
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  EXT_REF?: string | null;
  @ApiProperty({
    description: "De omschrijving van de groep",
    maxLength: 75,
    type: "string",
    required: false,
  })
  @IsOptional()
  @IsString()
  OMSCHRIJVING?: string;
  @ApiProperty({
    type: "integer",
    format: "int32",
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsInt()
  SORTEER_VOLGORDE?: number | null;
  @ApiProperty({
    description:
      "Is dit type readonly. Indien readonly kan de groep niet worden aangepast vanwege harde verwijzing in de source code",
    type: "boolean",
    default: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  READ_ONLY?: boolean;
  @ApiProperty({
    description: "Het bedrag om te kunnen factureren",
    type: "number",
    format: "double",
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsDecimal()
  BEDRAG?: Prisma.Decimal | null;
  @ApiProperty({
    description: "De eenheden om te kunnen boeken, bijvoorbeeld DDWV strippen",
    type: "number",
    format: "double",
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsDecimal()
  EENHEDEN?: Prisma.Decimal | null;
}
