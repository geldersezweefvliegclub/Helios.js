import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean, IsInt, IsOptional, IsString } from "class-validator";

export class UpdateRefTypesGroepDto {
  @ApiProperty({
    description:
      "De primary ID van de groep, andere objecten refereren naar dit ID",
    type: "integer",
    format: "int32",
    default: "autoincrement",
    required: false,
  })
  @IsOptional()
  @IsInt()
  ID?: number;
  @ApiProperty({
    description: "De code van de groep",
    maxLength: 10,
    type: "string",
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  CODE?: string | null;
  @ApiProperty({
    description: "De externe referentie van de groep",
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
    description: "De sorteer volgorde van de groep",
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
      "Is de groep readonly. Indien readonly kan de groep niet worden aangepast vanwege harde verwijzing in de source code",
    type: "boolean",
    default: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  READ_ONLY?: boolean;
}
