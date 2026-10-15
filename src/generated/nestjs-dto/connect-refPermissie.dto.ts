import { ApiExtraModels, ApiProperty } from "@nestjs/swagger";
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";

export class RefPermissieRolIdEndpointUniqueInputDto {
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
}

@ApiExtraModels(RefPermissieRolIdEndpointUniqueInputDto)
export class ConnectRefPermissieDto {
  @ApiProperty({
    description: "De primary ID van de permissie",
    type: "integer",
    format: "int32",
    required: false,
  })
  @IsOptional()
  @IsInt()
  ID?: number;
  @ApiProperty({
    type: RefPermissieRolIdEndpointUniqueInputDto,
    required: false,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => RefPermissieRolIdEndpointUniqueInputDto)
  ROL_ID_ENDPOINT?: RefPermissieRolIdEndpointUniqueInputDto;
}
