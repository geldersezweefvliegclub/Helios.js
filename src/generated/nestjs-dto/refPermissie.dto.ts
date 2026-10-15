import { ApiProperty } from "@nestjs/swagger";

export class RefPermissieDto {
  @ApiProperty({
    description: "De primary ID van de permissie",
    type: "integer",
    format: "int32",
  })
  ID: number;
  @ApiProperty({
    description:
      "De rol die toegang krijgt: een type uit de groep Rollen (27) of een lidtype uit de groep Lidmaatschap (6)",
    type: "integer",
    format: "int32",
  })
  ROL_ID: number;
  @ApiProperty({
    description:
      "Het endpoint waar de rol toegang toe krijgt, bijv Leden.UpdateObject. Met Leden.* krijgt de rol toegang tot alle endpoints van de module. Zie Permissie/GetEndpoints",
    maxLength: 100,
    type: "string",
  })
  ENDPOINT: string;
  @ApiProperty({
    description: "Is het record gemarkeerd als verwijderd",
    type: "boolean",
  })
  VERWIJDERD: boolean;
  @ApiProperty({
    description: "Tijdstempel met de laatste wijziging van het record",
    type: "string",
    format: "date-time",
  })
  LAATSTE_AANPASSING: Date;
}
