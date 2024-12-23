import { Prisma } from "@prisma/client";
import { ApiProperty } from "@nestjs/swagger";
import { IsDecimal, IsInt, IsOptional, IsString } from "class-validator";

export class UpdateOperBrandstofDto {
  @ApiProperty({
    description:
      "De primary ID van het tankbeurt, andere objecten refereren naar dit ID",
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
      "Verwijzing naar het lid ID van de persoon die getankt heeft, link naar de leden tabel",
    type: "integer",
    format: "int32",
    required: false,
  })
  @IsOptional()
  @IsInt()
  LID_ID?: number;
  @ApiProperty({
    description: "Vliegstatus van het lid (bv. DBO, Solist, Brevethouder etc.)",
    type: "integer",
    format: "int32",
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsInt()
  BRANDSTOF_TYPE_ID?: number | null;
  @ApiProperty({
    description: "Prijs per liter van de brandstof",
    type: "number",
    format: "double",
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsDecimal()
  PRIJS?: Prisma.Decimal | null;
  @ApiProperty({
    description: "Het bedrag van de tankbeurt om te kunnen factureren",
    type: "number",
    format: "double",
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsDecimal()
  BEDRAG?: Prisma.Decimal | null;
  @ApiProperty({
    description: "Aantal liters dat getankt is",
    type: "number",
    format: "double",
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsDecimal()
  LITERS?: Prisma.Decimal | null;
  @ApiProperty({
    description: "Externe referentie van de tankbeurt",
    maxLength: 50,
    type: "string",
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  EXT_REF?: string | null;
}
