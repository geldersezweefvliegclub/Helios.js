import {Body, Controller, Get, HttpException, HttpStatus, Logger, Query, UseGuards} from '@nestjs/common';
import {TypesService} from "./types.service";
import {Prisma, RefLid} from '@prisma/client';
import {GetObjectsRefTypesRequest} from "./GetObjectsRefTypesRequest";
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
import {CreateRefTypeDto} from "../../generated/nestjs-dto/create-refType.dto";
import {UpdateRefTypeDto} from "../../generated/nestjs-dto/update-refType.dto";
import {ApiBasicAuth, ApiExtraModels, ApiOperation, ApiResponse, ApiTags, getSchemaPath} from "@nestjs/swagger";
import {AuthGuard} from "@nestjs/passport";
import {GetRefTypesResponse} from "./GetRefTypesResponse";
import {CurrentUser} from "../login/current-user.decorator";
import {PermissieService} from "../authorisatie/permissie.service";
import {safeStringify} from "../../core/helpers/LogHelper";
import {bodyHeeftData} from "../../core/helpers/RequestGuards";

@Controller('Types')
@ApiTags('Types')
export class TypesController extends HeliosController
{
   private readonly logger = new Logger(TypesController.name);

   constructor(private readonly typesService: TypesService,
               private readonly permissieService:PermissieService)
   {
      super()
   }

   @HeliosGetObject(GetRefTypesResponse)
   async GetObject(
      @CurrentUser() currentUser: RefLid,
      @Query('ID') id: number): Promise<GetRefTypesResponse>
   {
      this.logger.verbose(`TypesController.GetObject(${safeStringify({currentUser, id})})`);
      this.permissieService.heeftToegang(currentUser, 'Types.GetObject');
      this.heeftDataToegangGetObject(currentUser);
      return await this.typesService.GetObject(id);
   }

   @HeliosGetObjects(GetRefTypesResponse)
   async GetObjects(
      @CurrentUser() currentUser: RefLid,
      @Query() queryParams: GetObjectsRefTypesRequest): Promise<IHeliosGetObjectsResponse<GetRefTypesResponse>>
   {
      this.logger.verbose(`TypesController.GetObjects(${safeStringify({currentUser, queryParams})})`);
      this.permissieService.heeftToegang(currentUser, 'Types.GetObjects');
      this.heeftDataToegangGetObjects(currentUser);
      return await this.typesService.GetObjects(queryParams);
   }

   @HeliosCreateObject(CreateRefTypeDto, GetRefTypesResponse)
   async AddObject(
      @CurrentUser() currentUser: RefLid,
      @Body() data: CreateRefTypeDto): Promise<GetRefTypesResponse>
   {
      this.logger.verbose(`TypesController.AddObject(${safeStringify({currentUser, data})})`);
      this.permissieService.heeftToegang(currentUser, 'Types.AddObject');
      this.heeftDataToegangAddObject(currentUser);
      bodyHeeftData(data);

      const insert = await this.normaliserenData(data) as Prisma.RefTypeUncheckedCreateInput;
      return await this.typesService.AddObject(insert, currentUser.ID);
   }

   @HeliosUpdateObject(UpdateRefTypeDto, GetRefTypesResponse)
   @ApiResponse({status: HttpStatus.FORBIDDEN, description: 'Type is read-only.'})
   async UpdateObject(
      @CurrentUser() currentUser: RefLid,
      @Query('ID') id: number, @Body() data: UpdateRefTypeDto): Promise<GetRefTypesResponse>
   {
      this.logger.verbose(`TypesController.UpdateObject(${safeStringify({currentUser, id, data})})`);
      this.permissieService.heeftToegang(currentUser, 'Types.UpdateObject');
      this.heeftDataToegangUpdateObject(currentUser);
      bodyHeeftData(data);
      id = id ?? data.ID;

      const update = await this.normaliserenData(data) as Prisma.RefTypeUncheckedUpdateInput;
      return await this.typesService.UpdateObject(id, update, currentUser.ID);
   }

   @HeliosDeleteObject()
   @ApiResponse({status: HttpStatus.FORBIDDEN, description: 'Type is read-only.'})
   async DeleteObject(
      @CurrentUser() currentUser: RefLid,
      @Query('ID') id: number): Promise<void>
   {
      this.logger.verbose(`TypesController.DeleteObject(${safeStringify({currentUser, id})})`);
      this.permissieService.heeftToegang(currentUser, 'Types.DeleteObject');
      this.heeftDataToegangDeleteObject(currentUser);

      const data: Prisma.RefTypeUncheckedUpdateInput = {
         VERWIJDERD: true
      }
      await this.typesService.UpdateObject(id, data, currentUser.ID);
   }

   @HeliosRemoveObject()
   @ApiResponse({status: HttpStatus.FORBIDDEN, description: 'Type is read-only.'})
   async RemoveObject(
      @CurrentUser() currentUser: RefLid,
      @Query('ID') id: number): Promise<void>
   {
      this.logger.verbose(`TypesController.RemoveObject(${safeStringify({currentUser, id})})`);
      this.permissieService.heeftToegang(currentUser, 'Types.RemoveObject');
      this.heeftDataToegangRemoveObject(currentUser);
      await this.typesService.RemoveObject(id, currentUser.ID);
   }

   @HeliosRestoreObject()
   @ApiResponse({status: HttpStatus.FORBIDDEN, description: 'Type is read-only.'})
   async RestoreObject(
      @CurrentUser() currentUser: RefLid,
      @Query('ID') id: number): Promise<void>
   {
      this.logger.verbose(`TypesController.RestoreObject(${safeStringify({currentUser, id})})`);
      this.permissieService.heeftToegang(currentUser, 'Types.RestoreObject');
      this.heeftDataToegangRestoreObject(currentUser);

      const data: Prisma.RefTypeUncheckedUpdateInput = {
         VERWIJDERD: false
      }
      await this.typesService.UpdateObject(id, data, currentUser.ID);
   }

   // gedeelde verwerking van AddObject en UpdateObject: verwijdert de niet-instelbare velden
   // (GROEP is al een kale scalaire FK-kolom op het model, dus die kan ongewijzigd mee)
   private async normaliserenData(
      data: CreateRefTypeDto | UpdateRefTypeDto): Promise<Prisma.RefTypeUncheckedCreateInput | Prisma.RefTypeUncheckedUpdateInput>
   {
      // VERWIJDERD, LAATSTE_AANPASSING en ID zijn nooit direct instelbaar door de client - ook al accepteert de
      // DTO ze (zodat een eerder opgehaald record ongewijzigd teruggestuurd kan worden), een meegegeven
      // waarde wordt hier altijd genegeerd
      delete data.VERWIJDERD;
      delete data.LAATSTE_AANPASSING;
      delete data.ID;

      return data as Prisma.RefTypeUncheckedCreateInput | Prisma.RefTypeUncheckedUpdateInput;
   }

   //------------- Specifieke endpoints staan hieronder --------------------//

   @Get("GetClubVliegtuigenTypes")
   @ApiBasicAuth()
   @UseGuards(AuthGuard(['jwt', 'basic-auth']))
   @ApiExtraModels(GetRefTypesResponse)
   @ApiOperation({summary: 'De vliegtuigtypes van de clubkisten, gesorteerd op SORTEER_VOLGORDE.'})
   @ApiResponse({status: HttpStatus.UNAUTHORIZED, description: 'Geen toegang.'})
   @ApiResponse({
      status: HttpStatus.OK, description: 'Types opgehaald.', schema: {
         type: 'object',
         properties: {
            dataset: {type: 'array', items: {'$ref': getSchemaPath(GetRefTypesResponse)}},
            totaal: {type: 'number'},
            hash: {type: 'string'},
         }
      }
   })
   async GetClubVliegtuigenTypes(
      @CurrentUser() currentUser: RefLid): Promise<IHeliosGetObjectsResponse<GetRefTypesResponse>>
   {
      this.logger.verbose(`TypesController.GetClubVliegtuigenTypes(${safeStringify({currentUser})})`);
      this.permissieService.heeftToegang(currentUser, 'Types.GetClubVliegtuigenTypes');
      this.heeftDataToegangGetClubVliegtuigenTypes(currentUser);
      return await this.typesService.GetClubVliegtuigenTypes();
   }

   // controleer of de gebruiker toegang heeft tot de data van Types/GetObject
   private heeftDataToegangGetObject(_currentUser: RefLid): void
   {
      // throw new HttpException("Geen toegang", HttpStatus.UNAUTHORIZED);
   }

   // controleer of de gebruiker toegang heeft tot de data van Types/GetObjects
   private heeftDataToegangGetObjects(_currentUser: RefLid): void
   {
      // throw new HttpException("Geen toegang", HttpStatus.UNAUTHORIZED);
   }

   // controleer of de gebruiker toegang heeft tot de data van Types/AddObject
   private heeftDataToegangAddObject(currentUser: RefLid): void
   {
      // alleen de beheerder, zie heeftDataToegang(null, false) in AddObject() van class.Types.inc.php
      if (!this.permissieService.isBeheerder(currentUser))
         throw new HttpException("Geen schrijfrechten", HttpStatus.UNAUTHORIZED);
   }

   // controleer of de gebruiker toegang heeft tot de data van Types/UpdateObject
   private heeftDataToegangUpdateObject(currentUser: RefLid): void
   {
      // alleen de beheerder, zie heeftDataToegang(null, false) in UpdateObject() van class.Types.inc.php
      if (!this.permissieService.isBeheerder(currentUser))
         throw new HttpException("Geen schrijfrechten", HttpStatus.UNAUTHORIZED);
   }

   // controleer of de gebruiker toegang heeft tot de data van Types/DeleteObject
   private heeftDataToegangDeleteObject(currentUser: RefLid): void
   {
      // alleen de beheerder, zie heeftDataToegang(null, false) in VerwijderObject() van class.Types.inc.php
      if (!this.permissieService.isBeheerder(currentUser))
         throw new HttpException("Geen schrijfrechten", HttpStatus.UNAUTHORIZED);
   }

   // controleer of de gebruiker toegang heeft tot de data van Types/RemoveObject
   private heeftDataToegangRemoveObject(currentUser: RefLid): void
   {
      // bestaat niet in PHP; zelfde rechten als DeleteObject
      if (!this.permissieService.isBeheerder(currentUser))
         throw new HttpException("Geen schrijfrechten", HttpStatus.UNAUTHORIZED);
   }

   // controleer of de gebruiker toegang heeft tot de data van Types/RestoreObject
   private heeftDataToegangRestoreObject(currentUser: RefLid): void
   {
      // alleen de beheerder, zie heeftDataToegang(null, false) in HerstelObject() van class.Types.inc.php
      if (!this.permissieService.isBeheerder(currentUser))
         throw new HttpException("Geen schrijfrechten", HttpStatus.UNAUTHORIZED);
   }

   // controleer of de gebruiker toegang heeft tot de data van Types/GetClubVliegtuigenTypes
   private heeftDataToegangGetClubVliegtuigenTypes(_currentUser: RefLid): void
   {
      // throw new HttpException("Geen toegang", HttpStatus.UNAUTHORIZED);
   }
}
