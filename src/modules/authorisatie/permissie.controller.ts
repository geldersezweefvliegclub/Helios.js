import {Body, Controller, Get, HttpException, HttpStatus, Logger, Query, UseGuards} from '@nestjs/common';
import {Prisma, RefLid} from '@prisma/client';
import {IHeliosGetObjectsResponse} from "../../core/DTO/IHeliosGetObjectsResponse";
import {
   HeliosController,
   HeliosCreateObject,
   HeliosDeleteObject,
   HeliosGetObject,
   HeliosGetObjects,
   HeliosRemoveObject,
   HeliosRestoreObject,
   HeliosUpdateObject
} from "../../core/controllers/helios/helios.controller";
import {RefPermissieDto} from "../../generated/nestjs-dto/refPermissie.dto";
import {CreateRefPermissieDto} from "../../generated/nestjs-dto/create-refPermissie.dto";
import {UpdateRefPermissieDto} from "../../generated/nestjs-dto/update-refPermissie.dto";
import {ApiBasicAuth, ApiOperation, ApiResponse, ApiTags} from "@nestjs/swagger";
import {AuthGuard} from "@nestjs/passport";
import {CurrentUser} from "../login/current-user.decorator";
import {PermissieService} from "./permissie.service";
import {GetObjectsRefPermissieRequest} from "./GetObjectsRefPermissieRequest";
import {safeStringify} from "../../core/helpers/LogHelper";
import {bodyHeeftData} from "../../core/helpers/RequestGuards";

@Controller('Permissie')
@ApiTags('Permissie')
export class PermissieController extends HeliosController
{
   private readonly logger = new Logger(PermissieController.name);

   constructor(private readonly permissieService: PermissieService)
   {
      super()
   }

   @HeliosGetObject(RefPermissieDto)
   async GetObject(
      @CurrentUser() currentUser: RefLid,
      @Query('ID') id: number): Promise<RefPermissieDto>
   {
      this.logger.verbose(`PermissieController.GetObject(${safeStringify({currentUser, id})})`);
      this.permissieService.heeftToegang(currentUser, 'Permissie.GetObject');
      this.heeftDataToegangGetObject(currentUser);
      return await this.permissieService.GetObject(id);
   }

   @HeliosGetObjects(RefPermissieDto)
   async GetObjects(
      @CurrentUser() currentUser: RefLid,
      @Query() queryParams: GetObjectsRefPermissieRequest): Promise<IHeliosGetObjectsResponse<RefPermissieDto>>
   {
      this.logger.verbose(`PermissieController.GetObjects(${safeStringify({currentUser, queryParams})})`);
      this.permissieService.heeftToegang(currentUser, 'Permissie.GetObjects');
      this.heeftDataToegangGetObjects(currentUser);
      return await this.permissieService.GetObjects(queryParams);
   }

   @HeliosCreateObject(CreateRefPermissieDto, RefPermissieDto)
   async AddObject(
      @CurrentUser() currentUser: RefLid,
      @Body() data: CreateRefPermissieDto): Promise<RefPermissieDto>
   {
      this.logger.verbose(`PermissieController.AddObject(${safeStringify({currentUser, data})})`);
      this.permissieService.heeftToegang(currentUser, 'Permissie.AddObject');
      this.heeftDataToegangAddObject(currentUser);
      bodyHeeftData(data);

      const insert = await this.normaliserenData(data) as Prisma.RefPermissieUncheckedCreateInput;
      return await this.permissieService.AddObject(insert, currentUser.ID);
   }

   @HeliosUpdateObject(UpdateRefPermissieDto, RefPermissieDto)
   async UpdateObject(
      @CurrentUser() currentUser: RefLid,
      @Query('ID') id: number, @Body() data: UpdateRefPermissieDto): Promise<RefPermissieDto>
   {
      this.logger.verbose(`PermissieController.UpdateObject(${safeStringify({currentUser, id, data})})`);
      this.permissieService.heeftToegang(currentUser, 'Permissie.UpdateObject');
      this.heeftDataToegangUpdateObject(currentUser);
      bodyHeeftData(data);
      id = id ?? data.ID;

      const update = await this.normaliserenData(data) as Prisma.RefPermissieUncheckedUpdateInput;
      return await this.permissieService.UpdateObject(id, update, currentUser.ID);
   }

   @HeliosDeleteObject()
   async DeleteObject(
      @CurrentUser() currentUser: RefLid,
      @Query('ID') id: number): Promise<void>
   {
      this.logger.verbose(`PermissieController.DeleteObject(${safeStringify({currentUser, id})})`);
      this.permissieService.heeftToegang(currentUser, 'Permissie.DeleteObject');
      this.heeftDataToegangDeleteObject(currentUser);

      const data: Prisma.RefPermissieUncheckedUpdateInput = {
         VERWIJDERD: true
      }
      await this.permissieService.UpdateObject(id, data, currentUser.ID);
   }

   @HeliosRemoveObject()
   async RemoveObject(
      @CurrentUser() currentUser: RefLid,
      @Query('ID') id: number): Promise<void>
   {
      this.logger.verbose(`PermissieController.RemoveObject(${safeStringify({currentUser, id})})`);
      this.permissieService.heeftToegang(currentUser, 'Permissie.RemoveObject');
      this.heeftDataToegangRemoveObject(currentUser);
      await this.permissieService.RemoveObject(id, currentUser.ID);
   }

   @HeliosRestoreObject()
   async RestoreObject(
      @CurrentUser() currentUser: RefLid,
      @Query('ID') id: number): Promise<void>
   {
      this.logger.verbose(`PermissieController.RestoreObject(${safeStringify({currentUser, id})})`);
      this.permissieService.heeftToegang(currentUser, 'Permissie.RestoreObject');
      this.heeftDataToegangRestoreObject(currentUser);

      const data: Prisma.RefPermissieUncheckedUpdateInput = {
         VERWIJDERD: false
      }
      await this.permissieService.UpdateObject(id, data, currentUser.ID);
   }

   // gedeelde verwerking van AddObject en UpdateObject: verwijdert de niet-instelbare velden
   private async normaliserenData(
      data: CreateRefPermissieDto | UpdateRefPermissieDto): Promise<Prisma.RefPermissieUncheckedCreateInput | Prisma.RefPermissieUncheckedUpdateInput>
   {
      // VERWIJDERD, LAATSTE_AANPASSING en ID zijn nooit direct instelbaar door de client - ook al accepteert de
      // DTO ze (zodat een eerder opgehaald record ongewijzigd teruggestuurd kan worden), een meegegeven
      // waarde wordt hier altijd genegeerd
      delete data.VERWIJDERD;
      delete data.LAATSTE_AANPASSING;
      delete data.ID;

      return data as Prisma.RefPermissieUncheckedCreateInput | Prisma.RefPermissieUncheckedUpdateInput;
   }

   //------------- Specifieke endpoints staan hieronder --------------------//

   @Get("GetEndpoints")
   @ApiBasicAuth()
   @UseGuards(AuthGuard(['jwt', 'basic-auth']))
   @ApiOperation({summary: 'Alle endpoints van de applicatie (bijv Leden.UpdateObject) en per module een wildcard (bijv Leden.*), de geldige waarden voor ENDPOINT.'})
   @ApiResponse({status: HttpStatus.UNAUTHORIZED, description: 'Geen toegang.'})
   @ApiResponse({status: HttpStatus.OK, description: 'Endpoints opgehaald.', schema: {type: 'array', items: {type: 'string'}}})
   async GetEndpoints(
      @CurrentUser() currentUser: RefLid): Promise<string[]>
   {
      this.logger.verbose(`PermissieController.GetEndpoints(${safeStringify({currentUser})})`);
      this.permissieService.heeftToegang(currentUser, 'Permissie.GetEndpoints');
      this.heeftDataToegangGetEndpoints(currentUser);
      return this.permissieService.GetEndpoints();
   }

   // controleer of de gebruiker toegang heeft tot de data van Permissie/GetObject
   private heeftDataToegangGetObject(_currentUser: RefLid): void
   {
      // throw new HttpException("Geen toegang", HttpStatus.UNAUTHORIZED);
   }

   // controleer of de gebruiker toegang heeft tot de data van Permissie/GetObjects
   private heeftDataToegangGetObjects(_currentUser: RefLid): void
   {
      // throw new HttpException("Geen toegang", HttpStatus.UNAUTHORIZED);
   }

   // controleer of de gebruiker toegang heeft tot de data van Permissie/AddObject
   private heeftDataToegangAddObject(currentUser: RefLid): void
   {
      if (!this.permissieService.isBeheerder(currentUser))
         throw new HttpException("Geen schrijfrechten", HttpStatus.UNAUTHORIZED);
   }

   // controleer of de gebruiker toegang heeft tot de data van Permissie/UpdateObject
   private heeftDataToegangUpdateObject(currentUser: RefLid): void
   {
      if (!this.permissieService.isBeheerder(currentUser))
         throw new HttpException("Geen schrijfrechten", HttpStatus.UNAUTHORIZED);
   }

   // controleer of de gebruiker toegang heeft tot de data van Permissie/DeleteObject
   private heeftDataToegangDeleteObject(currentUser: RefLid): void
   {
      if (!this.permissieService.isBeheerder(currentUser))
         throw new HttpException("Geen schrijfrechten", HttpStatus.UNAUTHORIZED);
   }

   // controleer of de gebruiker toegang heeft tot de data van Permissie/RemoveObject
   private heeftDataToegangRemoveObject(currentUser: RefLid): void
   {
      if (!this.permissieService.isBeheerder(currentUser))
         throw new HttpException("Geen schrijfrechten", HttpStatus.UNAUTHORIZED);
   }

   // controleer of de gebruiker toegang heeft tot de data van Permissie/RestoreObject
   private heeftDataToegangRestoreObject(currentUser: RefLid): void
   {
      if (!this.permissieService.isBeheerder(currentUser))
         throw new HttpException("Geen schrijfrechten", HttpStatus.UNAUTHORIZED);
   }

   // controleer of de gebruiker toegang heeft tot de data van Permissie/GetEndpoints
   private heeftDataToegangGetEndpoints(currentUser: RefLid): void
   {
      if (!this.permissieService.isBeheerder(currentUser))
         throw new HttpException("Geen toegang", HttpStatus.UNAUTHORIZED);
   }
}
