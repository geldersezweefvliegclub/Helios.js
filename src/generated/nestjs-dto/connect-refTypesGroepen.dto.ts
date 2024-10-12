import { ApiProperty } from "@nestjs/swagger";

export class ConnectRefTypesGroepenDto {
  @ApiProperty({
    description:
      "De primary ID van de groep, andere objecten refereren naar dit ID",
    type: "integer",
    format: "int32",
  })
  ID: number;
}
