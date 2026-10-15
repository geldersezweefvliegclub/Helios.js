import { ApiProperty } from "@nestjs/swagger";
import {
  IsBoolean,
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
} from "class-validator";

export class CreateRefPermissieDto {
  @ApiProperty({
    description: "De primary ID van de permissie",
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
      "De rol die toegang krijgt: een type uit de groep Rollen (27) of een lidtype uit de groep Lidmaatschap (6)",
    type: "integer",
    format: "int32",
  })
  @IsNotEmpty()
  @IsInt()
  ROL_ID: number;
  @ApiProperty({
    description:
      "Het endpoint waar de rol toegang toe krijgt, bijv Leden.UpdateObject. Met Leden.* krijgt de rol toegang tot alle endpoints van de module. Zie Permissie/GetEndpoints",
    maxLength: 100,
    type: "string",
  })
  @IsNotEmpty()
  @IsString()
  ENDPOINT: string;
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
