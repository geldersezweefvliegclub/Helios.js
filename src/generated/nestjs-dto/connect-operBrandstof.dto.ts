import { ApiProperty } from "@nestjs/swagger";
import { IsInt, IsNotEmpty } from "class-validator";

export class ConnectOperBrandstofDto {
  @ApiProperty({
    description:
      "De primary ID van het tankbeurt, andere objecten refereren naar dit ID",
    type: "integer",
    format: "int32",
  })
  @IsNotEmpty()
  @IsInt()
  ID: number;
}
