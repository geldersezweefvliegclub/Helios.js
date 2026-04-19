import {ApiProperty, getSchemaPath} from '@nestjs/swagger';

export class GetLogboekRowResponse
{
   @ApiProperty() ID: number;
   @ApiProperty() DATUM: string;
   @ApiProperty() REG_CALL: string;
   @ApiProperty() VLIEGTUIG_ID: number;
   @ApiProperty({nullable: true}) STARTTIJD: string | null;
   @ApiProperty({nullable: true}) LANDINGSTIJD: string | null;
   @ApiProperty() DUUR: string;
   @ApiProperty({nullable: true}) VLIEGERNAAM: string | null;
   @ApiProperty({nullable: true}) INZITTENDENAAM: string | null;
   @ApiProperty({nullable: true}) VLIEGER_ID: number | null;
   @ApiProperty({nullable: true}) INZITTENDE_ID: number | null;
   @ApiProperty({nullable: true}) STARTMETHODE: string | null;
   @ApiProperty({nullable: true}) VELD: string | null;
   @ApiProperty() PAX: boolean;
   @ApiProperty() INSTRUCTIEVLUCHT: boolean;
   @ApiProperty() CHECKSTART: boolean;
   @ApiProperty({nullable: true}) VLIEGTUIGTYPE: string | null;
   @ApiProperty({nullable: true}) OPMERKINGEN: string | null;
   @ApiProperty({nullable: true}) LAATSTE_AANPASSING?: string | null;
}

export class StartlijstObjectResponse
{
   @ApiProperty() ID: number;
   @ApiProperty() DATUM: string;
   @ApiProperty() DAGNUMMER: number;
   @ApiProperty() VLIEGTUIG_ID: number;
   @ApiProperty({nullable: true}) STARTTIJD: string | null;
   @ApiProperty({nullable: true}) LANDINGSTIJD: string | null;
   @ApiProperty({nullable: true}) STARTMETHODE_ID: number | null;
   @ApiProperty({nullable: true}) VLIEGER_ID: number | null;
   @ApiProperty({nullable: true}) INZITTENDE_ID: number | null;
   @ApiProperty({nullable: true}) VLIEGERNAAM: string | null;
   @ApiProperty({nullable: true}) INZITTENDENAAM: string | null;
   @ApiProperty({nullable: true}) SLEEPKIST_ID: number | null;
   @ApiProperty({nullable: true}) SLEEP_HOOGTE: number | null;
   @ApiProperty({nullable: true}) VELD_ID: number | null;
   @ApiProperty({nullable: true}) BAAN_ID: number | null;
   @ApiProperty({nullable: true}) OPMERKINGEN: string | null;
   @ApiProperty({nullable: true}) EXTERNAL_ID: string | null;
   @ApiProperty() PAX: boolean;
   @ApiProperty() CHECKSTART: boolean;
   @ApiProperty() INSTRUCTIEVLUCHT: boolean;
   @ApiProperty() VERWIJDERD: boolean;
   @ApiProperty({nullable: true}) LAATSTE_AANPASSING: string | null;
}

export class GetObjectsStartlijstRowResponse extends StartlijstObjectResponse
{
   @ApiProperty({nullable: true}) REGISTRATIE?: string | null;
   @ApiProperty({nullable: true}) CALLSIGN?: string | null;
   @ApiProperty({nullable: true}) CLUBKIST?: boolean | null;
   @ApiProperty({nullable: true}) SLEEPKIST?: string | null;
   @ApiProperty({nullable: true}) REG_CALL?: string | null;
   @ApiProperty({nullable: true}) DUUR?: string | null;
   @ApiProperty({nullable: true}) VLIEGERNAAM_LID?: string | null;
   @ApiProperty({nullable: true}) INZITTENDENAAM_LID?: string | null;
   @ApiProperty({nullable: true}) VLIEGTUIGTYPE?: string | null;
   @ApiProperty({nullable: true}) VLIEGTUIG_TYPE_ID?: number | null;
   @ApiProperty({nullable: true}) VLIEGER_LIDTYPE_ID?: number | null;
   @ApiProperty({nullable: true}) INZITTENDE_LIDTYPE_ID?: number | null;
   @ApiProperty({nullable: true}) DDWV?: boolean | null;
   @ApiProperty({nullable: true}) STARTMETHODE?: string | null;
   @ApiProperty({nullable: true}) VELD?: string | null;
   @ApiProperty({nullable: true}) BAAN?: string | null;
}

export class GetObjectsStartlijstResponse
{
   @ApiProperty() totaal: number;
   @ApiProperty({nullable: true}) laatste_aanpassing: string | null;
   @ApiProperty({required: false}) hash?: string;
   @ApiProperty({
      nullable: true,
      type: 'array',
      items: {$ref: getSchemaPath(GetObjectsStartlijstRowResponse)},
   })
   dataset: GetObjectsStartlijstRowResponse[] | null;
}

export class GetVliegDagenRowResponse
{
   @ApiProperty() DATUM: string;
   @ApiProperty() STARTS: number;
   @ApiProperty({nullable: true}) VLIEGTIJD: string | null;
}

export class GetVliegDagenResponse
{
   @ApiProperty() totaal: number;
   @ApiProperty({nullable: true}) laatste_aanpassing: string | null;
   @ApiProperty({required: false}) hash?: string;
   @ApiProperty({
      nullable: true,
      type: 'array',
      items: {$ref: getSchemaPath(GetVliegDagenRowResponse)},
   })
   dataset: GetVliegDagenRowResponse[] | null;
}

export class GetRecencyResponse
{
   @ApiProperty() STARTS_DRIE_MND: number;
   @ApiProperty() STARTS_24_MND: number;
   @ApiProperty() STARTS_VORIG_JAAR: number;
   @ApiProperty() STARTS_DIT_JAAR: number;
   @ApiProperty() STARTS_INSTRUCTIE: number;
   @ApiProperty() UREN_DRIE_MND: string;
   @ApiProperty() UREN_24_MND: string;
   @ApiProperty() UREN_DIT_JAAR: string;
   @ApiProperty() UREN_VORIG_JAAR: string;
   @ApiProperty() UREN_INSTRUCTIE: string;
   @ApiProperty() STATUS_BAROMETER: string;
   @ApiProperty() WAARDE: number;
   @ApiProperty() STARTS_BAROMETER: number;
   @ApiProperty() UREN_BAROMETER: string;
   @ApiProperty() LIERSTARTS: number;
   @ApiProperty() SLEEPSTARTS: number;
   @ApiProperty() ZELFSTARTS: number;
   @ApiProperty() TMGSTARTS: number;
   @ApiProperty({type: 'array', items: {type: 'string'}}) CHECKS: string[];
}

export class GetLogboekResponse
{
   @ApiProperty({type: Number}) totaal: number;
   @ApiProperty({nullable: true}) laatste_aanpassing: string | null;
   @ApiProperty({required: false}) hash?: string;
   @ApiProperty({
      nullable: true,
      type: 'array',
      items: {$ref: getSchemaPath(GetLogboekRowResponse)},
   })
   dataset: GetLogboekRowResponse[] | null;
}

export class StartMethodeTotaalResponse
{
   @ApiProperty({nullable: true}) METHODE: string | null;
   @ApiProperty() AANTAL: number;
}

export class VliegtuigTotaalResponse
{
   @ApiProperty() REG_CALL: string;
   @ApiProperty() STARTS: number;
   @ApiProperty() VLIEGTIJD: string;
}

export class JaarTotaalResponse
{
   @ApiProperty() STARTS: number;
   @ApiProperty() INSTRUCTIE_STARTS: number;
   @ApiProperty() INSTRUCTIE_UREN: string;
   @ApiProperty() VLIEGTIJD: string;
}

export class GetLogboekTotalenResponse
{
   @ApiProperty() totaal: number;
   @ApiProperty({nullable: true}) laatste_aanpassing: string | null;
   @ApiProperty({required: false}) hash?: string;
   @ApiProperty({
      type: 'array',
      items: {$ref: getSchemaPath(StartMethodeTotaalResponse)},
   })
   starts: StartMethodeTotaalResponse[];
   @ApiProperty({
      type: 'array',
      items: {$ref: getSchemaPath(VliegtuigTotaalResponse)},
   })
   vliegtuigen: VliegtuigTotaalResponse[];
   @ApiProperty({type: () => JaarTotaalResponse}) jaar: JaarTotaalResponse;
   dataset?: null;
}

export class GetVliegtuigLogboekRowResponse
{
   @ApiProperty() DATUM: string;
   @ApiProperty() VLUCHTEN: number;
   @ApiProperty() LIERSTARTS: number;
   @ApiProperty() SLEEPSTARTS: number;
   @ApiProperty() VLIEGTIJD: string;
   @ApiProperty() REG_CALL: string;
}

export class GetVliegtuigLogboekResponse
{
   @ApiProperty() totaal: number;
   @ApiProperty({nullable: true}) laatste_aanpassing: string | null;
   @ApiProperty({required: false}) hash?: string;
   @ApiProperty({
      nullable: true,
      type: 'array',
      items: {$ref: getSchemaPath(GetVliegtuigLogboekRowResponse)},
   })
   dataset: GetVliegtuigLogboekRowResponse[] | null;
}

export class GetVliegtuigLogboekTotaalRowResponse
{
   @ApiProperty() MAAND: number;
   @ApiProperty() VLUCHTEN: number;
   @ApiProperty() LIERSTARTS: number;
   @ApiProperty() SLEEPSTARTS: number;
   @ApiProperty() VLIEGTIJD: string;
   @ApiProperty() REG_CALL: string;
}

export class VliegtuigMaandTotalenResponse
{
   @ApiProperty() VLUCHTEN: number;
   @ApiProperty() LIERSTARTS: number;
   @ApiProperty() SLEEPSTARTS: number;
   @ApiProperty() VLIEGTIJD: string;
}

export class GetVliegtuigLogboekTotalenResponse
{
   @ApiProperty() totaal: number;
   @ApiProperty({nullable: true}) laatste_aanpassing: string | null;
   @ApiProperty({required: false}) hash?: string;
   @ApiProperty({type: () => VliegtuigMaandTotalenResponse}) totalen: VliegtuigMaandTotalenResponse;
   @ApiProperty({
      nullable: true,
      type: 'array',
      items: {$ref: getSchemaPath(GetVliegtuigLogboekTotaalRowResponse)},
   })
   dataset: GetVliegtuigLogboekTotaalRowResponse[] | null;
}