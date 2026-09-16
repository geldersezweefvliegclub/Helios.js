import {ApiProperty} from "@nestjs/swagger";

export class AanwezigLedenSamenvattingType
{
   @ApiProperty({type: "integer", format: "int32"})
   id: number;

   @ApiProperty({type: String})
   type: string;

   @ApiProperty({type: "integer", format: "int32"})
   aantal: number;
}

export class AanwezigLedenSamenvattingOverland
{
   @ApiProperty({type: String, nullable: true})
   reg_call: string | null;

   @ApiProperty({type: String})
   naam: string;
}

// samenvatting van de aanmeldingen van een vliegdag, zie AanwezigLeden.Samenvatting() in de PHP implementatie
export class AanwezigLedenSamenvattingResponse
{
   @ApiProperty({type: "integer", format: "int32"})
   aanmeldingen: number;

   @ApiProperty({type: "integer", format: "int32", description: "Aantal aangemelde DBO-vliegers (STATUSTYPE_ID 1901)"})
   dbo: number;

   @ApiProperty({type: "integer", format: "int32", description: "Aantal aangemelde solisten (STATUSTYPE_ID 1902)"})
   solisten: number;

   @ApiProperty({type: "integer", format: "int32", description: "Aantal aangemelde brevethouders (STATUSTYPE_ID 1903)"})
   brevethouders: number;

   @ApiProperty({type: "integer", format: "int32"})
   lieristen: number;

   @ApiProperty({type: "integer", format: "int32"})
   instructeurs: number;

   @ApiProperty({type: "integer", format: "int32"})
   startleiders: number;

   @ApiProperty({type: [AanwezigLedenSamenvattingType], description: "Aantal aanmeldingen per gewenst clubvliegtuigtype"})
   types: AanwezigLedenSamenvattingType[];

   @ApiProperty({type: [AanwezigLedenSamenvattingOverland], description: "Aanmeldingen met een clubkist als overland-vliegtuig"})
   overland: AanwezigLedenSamenvattingOverland[];
}
