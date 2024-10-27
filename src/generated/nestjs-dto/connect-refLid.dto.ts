import { ApiProperty } from "@nestjs/swagger";
import { IsInt, IsNotEmpty } from "class-validator";

export class ConnectRefLidDto {
  @ApiProperty({
    description:
      "De primary ID van het type, andere objecten refereren naar dit ID",
    type: "integer",
    format: "int32",
  })
  @IsNotEmpty()
  @IsInt()
  ID: number;
}
