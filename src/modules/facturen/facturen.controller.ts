import {Body, Controller, Get, HttpCode, HttpStatus, Logger, Post, Query, UseGuards} from '@nestjs/common';
import {FacturenService} from "./facturen.service";
import {PermissieService} from "../authorisatie/permissie.service";
import {
   HeliosController,
   HeliosCreateObject, HeliosDeleteObject,
   HeliosGetObject,
   HeliosGetObjects, HeliosRemoveObject, HeliosRestoreObject,
   HeliosUpdateObject
} from "../../core/controllers/helios/helios.controller";
import {OperFactuurDto} from "../../generated/nestjs-dto/operFactuur.dto";
import {CurrentUser} from "../login/current-user.decorator";
import {Prisma, RefLid} from "@prisma/client";
import {GetObjectsOperFacturenResponse} from "./GetObjectsOperFacturenResponse";
import {GetObjectsOperFacturenRequest} from "./GetObjectsOperFacturenRequest";
import {IHeliosGetObjectsResponse} from "../../core/DTO/IHeliosGetObjectsResponse";
import {CreateOperFactuurDto} from "../../generated/nestjs-dto/create-operFactuur.dto";
import {UpdateOperFactuurDto} from "../../generated/nestjs-dto/update-operFactuur.dto";
import {ApiBasicAuth, ApiExtraModels, ApiOperation, ApiResponse, ApiTags, getSchemaPath} from "@nestjs/swagger";
import {AuthGuard} from "@nestjs/passport";
import {safeStringify} from "../../core/helpers/LogHelper";
import {bodyHeeftData} from "../../core/helpers/RequestGuards";
import {NogTeFacturerenRequest} from "./NogTeFacturerenRequest";
import {NogTeFacturerenResponse} from "./NogTeFacturerenResponse";
import {AanmakenFacturenRequest} from "./AanmakenFacturenRequest";
import {UploadFactuurRequest} from "./UploadFactuurRequest";
import {UploadTransactieFactuurRequest} from "./UploadTransactieFactuurRequest";

@Controller('Facturen')
@ApiTags('Facturen')
export class FacturenController  extends HeliosController
{
   private readonly logger = new Logger(FacturenController.name);

   constructor(private readonly FacturenService: FacturenService,
               private readonly permissieService:PermissieService)
   {
      super()
   }

   @HeliosGetObject(OperFactuurDto)
   async GetObject(
      @CurrentUser() currentUser: RefLid,
      @Query('ID') id: number): Promise<OperFactuurDto>
   {
      this.logger.verbose(`FacturenController.GetObject(${safeStringify({currentUser, id})})`);
      // TODO: PHP vereist hier isBeheerder() (401 anders) - heeftToegang() is nog een no-op stub
      this.permissieService.heeftToegang(currentUser, 'Facturen.GetObject');
      return await this.FacturenService.GetObject(id);
   }

   @HeliosGetObjects(GetObjectsOperFacturenResponse)
   async GetObjects(
      @CurrentUser() currentUser: RefLid,
      @Query() queryParams: GetObjectsOperFacturenRequest): Promise<IHeliosGetObjectsResponse<GetObjectsOperFacturenResponse>>
   {
      this.logger.verbose(`FacturenController.GetObjects(${safeStringify({currentUser, queryParams})})`);
      // TODO: PHP vereist hier isBeheerder() (401 anders) - heeftToegang() is nog een no-op stub
      this.permissieService.heeftToegang(currentUser, 'Facturen.GetObjects');
      return await this.FacturenService.GetObjects(queryParams);
   }

   @HeliosCreateObject(CreateOperFactuurDto, OperFactuurDto)
   // NAAM wordt afgeleid van het gekoppelde lid (LID_ID) - service werpt dit als dat lid niet bestaat
   @ApiResponse({status: HttpStatus.NOT_FOUND, description: 'Lid (LID_ID) niet gevonden.'})
   async AddObject(
      @CurrentUser() currentUser: RefLid,
      @Body() data: CreateOperFactuurDto): Promise<OperFactuurDto>
   {
      this.logger.verbose(`FacturenController.AddObject(${safeStringify({currentUser, data})})`);
      bodyHeeftData(data);
      // TODO: PHP vereist hier isBeheerder() (401 anders) - heeftToegang() is nog een no-op stub
      this.permissieService.heeftToegang(currentUser, 'Facturen.AddObject');

      const insert = await this.normaliserenData(data) as Prisma.OperFactuurUncheckedCreateInput;
      return await this.FacturenService.AddObject(insert, currentUser.ID);
   }

   @HeliosUpdateObject(UpdateOperFactuurDto, OperFactuurDto)
   // Facturen-specifiek: een reeds geuploade factuur (FACTUUR_NUMMER gezet) mag niet meer verwijderd worden
   @ApiResponse({status: HttpStatus.METHOD_NOT_ALLOWED, description: 'Factuur is reeds geupload, kan niet meer verwijderd worden.'})
   async UpdateObject(
      @CurrentUser() currentUser: RefLid,
      @Query('ID') id: number, @Body() data: UpdateOperFactuurDto): Promise<OperFactuurDto>
   {
      bodyHeeftData(data);
      id = id ?? data.ID;
      this.logger.verbose(`FacturenController.UpdateObject(${safeStringify({currentUser, id, data})})`);
      // TODO: PHP vereist hier isBeheerder() (401 anders) - heeftToegang() is nog een no-op stub
      this.permissieService.heeftToegang(currentUser, 'Facturen.UpdateObject');

      const update = await this.normaliserenData(data) as Prisma.OperFactuurUncheckedUpdateInput;
      return await this.FacturenService.UpdateObject(id, update, currentUser.ID);
   }

   @HeliosDeleteObject()
   // Facturen-specifiek: een reeds geuploade factuur (FACTUUR_NUMMER gezet) mag niet meer verwijderd worden
   @ApiResponse({status: HttpStatus.METHOD_NOT_ALLOWED, description: 'Factuur is reeds geupload, kan niet meer verwijderd worden.'})
   async DeleteObject(
      @CurrentUser() currentUser: RefLid,
      @Query('ID') id: number): Promise<void>
   {
      this.logger.verbose(`FacturenController.DeleteObject(${safeStringify({currentUser, id})})`);
      // TODO: PHP vereist hier isBeheerder() (401 anders) - heeftToegang() is nog een no-op stub
      this.permissieService.heeftToegang(currentUser, 'Facturen.DeleteObject');

      const data: Prisma.OperFactuurUncheckedUpdateInput = {
         VERWIJDERD: true
      }
      await this.FacturenService.UpdateObject(id, data, currentUser.ID);
   }

   @HeliosRemoveObject()
   async RemoveObject(
      @CurrentUser() currentUser: RefLid,
      @Query('ID') id: number): Promise<void>
   {
      this.logger.verbose(`FacturenController.RemoveObject(${safeStringify({currentUser, id})})`);
      this.permissieService.heeftToegang(currentUser, 'Facturen.RemoveObject');
      await this.FacturenService.RemoveObject(id, currentUser.ID);
   }

   @HeliosRestoreObject()
   async RestoreObject(
      @CurrentUser() currentUser: RefLid,
      @Query('ID') id: number): Promise<void>
   {
      this.logger.verbose(`FacturenController.RestoreObject(${safeStringify({currentUser, id})})`);
      this.permissieService.heeftToegang(currentUser, 'Facturen.RestoreObject');

      const data: Prisma.OperFactuurUncheckedUpdateInput = {
         VERWIJDERD: false
      }
      await this.FacturenService.UpdateObject(id, data, currentUser.ID);
   }

   @Get('NogTeFactureren')
   @ApiBasicAuth()
   @UseGuards(AuthGuard(['jwt', 'basic-auth']))
   @ApiExtraModels(NogTeFacturerenResponse)
   @ApiOperation({summary: 'Leden die nog geen factuur hebben voor het opgegeven jaar.'})
   @ApiResponse({status: HttpStatus.BAD_REQUEST, description: 'Verkeerde input data.'})
   @ApiResponse({status: HttpStatus.NOT_MODIFIED, description: 'Data is ongewijzigd.'})
   @ApiResponse({status: HttpStatus.UNAUTHORIZED, description: 'Geen toegang.'})
   @ApiResponse({
      status: HttpStatus.OK, description: 'Data opgehaald.', schema: {
         type: 'object',
         properties: {
            dataset: {type: 'array', items: {$ref: getSchemaPath(NogTeFacturerenResponse)}},
            totaal: {type: 'number'},
            hash: {type: 'string'},
         }
      }
   })
   async NogTeFactureren(
      @CurrentUser() currentUser: RefLid,
      @Query() queryParams: NogTeFacturerenRequest): Promise<IHeliosGetObjectsResponse<NogTeFacturerenResponse>>
   {
      this.logger.verbose(`FacturenController.NogTeFactureren(${safeStringify({currentUser, queryParams})})`);
      // TODO: PHP vereist hier isBeheerder() (401 anders) - heeftToegang() is nog een no-op stub
      this.permissieService.heeftToegang(currentUser, 'Facturen.NogTeFactureren');
      return await this.FacturenService.NogTeFactureren(queryParams.JAAR, queryParams.HASH);
   }

   @Post('AanmakenFacturen')
   @ApiBasicAuth()
   @UseGuards(AuthGuard(['jwt', 'basic-auth']))
   @ApiExtraModels(OperFactuurDto)
   @ApiOperation({summary: 'Maak voor elk opgegeven lid een contributiefactuur aan op basis van het lidmaatschapstype.'})
   @ApiResponse({status: HttpStatus.BAD_REQUEST, description: 'Verkeerde input data.'})
   @ApiResponse({status: HttpStatus.UNAUTHORIZED, description: 'Geen toegang.'})
   @ApiResponse({status: HttpStatus.NOT_FOUND, description: 'Lid, lidtype, of contributiebedrag niet gevonden.'})
   @ApiResponse({
      status: HttpStatus.CREATED, description: 'Facturen aangemaakt.',
      schema: {type: 'array', items: {$ref: getSchemaPath(OperFactuurDto)}}
   })
   async AanmakenFacturen(
      @CurrentUser() currentUser: RefLid,
      @Body() data: AanmakenFacturenRequest): Promise<OperFactuurDto[]>
   {
      this.logger.verbose(`FacturenController.AanmakenFacturen(${safeStringify({currentUser, data})})`);
      bodyHeeftData(data);
      // TODO: PHP vereist hier isBeheerder() (401 anders) - heeftToegang() is nog een no-op stub
      this.permissieService.heeftToegang(currentUser, 'Facturen.AanmakenFacturen');
      return await this.FacturenService.AanmakenFacturen(data.JAAR, data.LID_ID, currentUser.ID);
   }

   @Post('UploadFactuur')
   @HttpCode(HttpStatus.ACCEPTED)
   @ApiBasicAuth()
   @UseGuards(AuthGuard(['jwt', 'basic-auth']))
   @ApiOperation({summary: 'Publiceert een MQTT bericht met de factuurgegevens van een bestaande factuur, voor verwerking door het externe interface-proces.'})
   @ApiResponse({status: HttpStatus.BAD_REQUEST, description: 'Verkeerde input data.'})
   @ApiResponse({status: HttpStatus.UNAUTHORIZED, description: 'Geen toegang.'})
   @ApiResponse({status: HttpStatus.NOT_FOUND, description: 'Factuur niet gevonden.'})
   @ApiResponse({status: HttpStatus.ACCEPTED, description: 'Bericht gepubliceerd op de MQTT bus.'})
   async UploadFactuur(
      @CurrentUser() currentUser: RefLid,
      @Body() data: UploadFactuurRequest): Promise<void>
   {
      this.logger.verbose(`FacturenController.UploadFactuur(${safeStringify({currentUser, data})})`);
      bodyHeeftData(data);
      // TODO: PHP vereist hier isBeheerder() (401 anders) - heeftToegang() is nog een no-op stub
      this.permissieService.heeftToegang(currentUser, 'Facturen.UploadFactuur');
      await this.FacturenService.UploadFactuur(data.ID);
   }

   @Post('UploadTransactieFactuur')
   @HttpCode(HttpStatus.ACCEPTED)
   @ApiBasicAuth()
   @UseGuards(AuthGuard(['jwt', 'basic-auth']))
   @ApiOperation({summary: 'Publiceert een MQTT bericht met de niet-gefactureerde DDWV-transacties van een lid op een vliegdag, voor verwerking door het externe interface-proces.'})
   @ApiResponse({status: HttpStatus.BAD_REQUEST, description: 'Verkeerde input data.'})
   @ApiResponse({status: HttpStatus.UNAUTHORIZED, description: 'Geen toegang.'})
   @ApiResponse({status: HttpStatus.NOT_FOUND, description: 'Lid of te factureren transacties niet gevonden.'})
   @ApiResponse({status: HttpStatus.ACCEPTED, description: 'Bericht gepubliceerd op de MQTT bus.'})
   async UploadTransactieFactuur(
      @CurrentUser() currentUser: RefLid,
      @Body() data: UploadTransactieFactuurRequest): Promise<void>
   {
      this.logger.verbose(`FacturenController.UploadTransactieFactuur(${safeStringify({currentUser, data})})`);
      bodyHeeftData(data);
      // TODO: PHP vereist hier isBeheerder() || isBeheerderDDWV() (401 anders) - heeftToegang() is nog een no-op stub
      this.permissieService.heeftToegang(currentUser, 'Facturen.UploadTransactieFactuur');
      await this.FacturenService.UploadTransactieFactuur(data.LID_ID, data.DATUM);
   }

   // gedeelde verwerking van AddObject en UpdateObject: verwijdert de niet-instelbare velden
   private async normaliserenData(
      data: CreateOperFactuurDto | UpdateOperFactuurDto): Promise<Prisma.OperFactuurUncheckedCreateInput | Prisma.OperFactuurUncheckedUpdateInput>
   {
      // VERWIJDERD, LAATSTE_AANPASSING en ID zijn nooit direct instelbaar door de client - ook al accepteert de
      // DTO ze (zodat een eerder opgehaald record ongewijzigd teruggestuurd kan worden), een meegegeven
      // waarde wordt hier altijd genegeerd
      delete data.VERWIJDERD;
      delete data.LAATSTE_AANPASSING;
      delete data.ID;

      return data as Prisma.OperFactuurUncheckedCreateInput | Prisma.OperFactuurUncheckedUpdateInput;
   }

   //------------- Specifieke endpoints staan hieronder --------------------//


}