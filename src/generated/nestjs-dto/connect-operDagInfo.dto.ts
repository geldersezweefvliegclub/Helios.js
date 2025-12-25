import { ApiProperty } from "@nestjs/swagger";
import { IsInt, IsNotEmpty } from "class-validator";

export class ConnectOperDagInfoDto {
  @ApiProperty({
    type: "integer",
    format: "int32",
  })
  @IsNotEmpty()
  @IsInt()
  ID: number;
}
