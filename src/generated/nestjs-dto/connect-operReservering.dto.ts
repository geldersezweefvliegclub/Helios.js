import { ApiProperty } from "@nestjs/swagger";
import { IsInt, IsNotEmpty } from "class-validator";

export class ConnectOperReserveringDto {
  @ApiProperty({
    type: "integer",
    format: "int32",
  })
  @IsNotEmpty()
  @IsInt()
  ID: number;
}
