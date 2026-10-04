import {
   Body,
   Controller,
   Logger,
   Query
} from '@nestjs/common';
import {TypesGroepenService} from "./types-groepen.service";
import {IHeliosGetObjectsResponse} from "../../core/DTO/IHeliosGetObjectsResponse";
import {
   HeliosController, HeliosCreateObject, HeliosDeleteObject,
   HeliosGetObject,
   HeliosGetObjects, HeliosRemoveObject,
   HeliosRestoreObject, HeliosUpdateObject
} from "../../core/controllers/helios/helios.controller";
import {RefTypesGroepDto} from "../../generated/nestjs-dto/refTypesGroep.dto";
import {GetObjectsRefTypesGroepenRequest} from "./GetObjectsRefTypesGroepenRequest";
import {Prisma, RefLid, RefTypesGroep} from "@prisma/client";
import {CurrentUser} from "../login/current-user.decorator";
import {ApiTags} from "@nestjs/swagger";
import {GetObjectsRefTypesGroepenResponse} from "./GetObjectsRefTypesGroepenResponse";
import {PermissieService} from "../authorisatie/permissie.service";
import {CreateRefTypesGroepDto} from "../../generated/nestjs-dto/create-refTypesGroep.dto";
import {UpdateRefTypesGroepDto} from "../../generated/nestjs-dto/update-refTypesGroep.dto";
import {safeStringify} from "../../core/helpers/LogHelper";
import {bodyHeeftData} from "../../core/helpers/RequestGuards";

@Controller('TypesGroepen')
@ApiTags('TypesGroepen')
export class TypesGroepenController extends HeliosController
{
   private readonly logger = new Logger(TypesGroepenController.name);

   constructor(private readonly permissieService:PermissieService,
               private readonly typesGroepenService: TypesGroepenService)
   {
      super()
   }

   @HeliosGetObject(RefTypesGroepDto)
   async GetObject(
      @CurrentUser() currentUser: RefLid,
      @Query('ID') id: number): Promise<RefTypesGroepDto>
   {
      this.logger.verbose(`TypesGroepenController.GetObject(${safeStringify({currentUser, id})})`);
      this.permissieService.heeftToegang(currentUser, 'TypesGroepen.GetObject');
      this.heeftDataToegangGetObject(currentUser);
      return await this.typesGroepenService.GetObject(id);
   }

   @HeliosGetObjects(GetObjectsRefTypesGroepenResponse)
   async GetObjects(
      @CurrentUser() currentUser: RefLid,
      @Query() queryParams: GetObjectsRefTypesGroepenRequest): Promise<IHeliosGetObjectsResponse<GetObjectsRefTypesGroepenResponse>>
   {
      this.logger.verbose(`TypesGroepenController.GetObjects(${safeStringify({currentUser, queryParams})})`);
      this.permissieService.heeftToegang(currentUser, 'TypesGroepen.GetObjects');
      this.heeftDataToegangGetObjects(currentUser);
      return await this.typesGroepenService.GetObjects(queryParams);
   }

   @HeliosCreateObject(CreateRefTypesGroepDto, RefTypesGroepDto)
   async AddObject(
      @CurrentUser() currentUser: RefLid,
      @Body() data: CreateRefTypesGroepDto): Promise<RefTypesGroepDto>
   {
      this.logger.verbose(`TypesGroepenController.AddObject(${safeStringify({currentUser, data})})`);
      this.permissieService.heeftToegang(currentUser, 'TypesGroepen.AddObject');
      this.heeftDataToegangAddObject(currentUser);
      bodyHeeftData(data);

      const insert = await this.normaliserenData(data) as Prisma.RefTypesGroepUncheckedCreateInput;
      return await this.typesGroepenService.AddObject(insert, currentUser.ID);
   }

   @HeliosUpdateObject(UpdateRefTypesGroepDto, RefTypesGroepDto)
   async UpdateObject(
      @CurrentUser() currentUser: RefLid,
      @Query('ID') id: number, @Body() data: UpdateRefTypesGroepDto): Promise<RefTypesGroep>
   {
      this.logger.verbose(`TypesGroepenController.UpdateObject(${safeStringify({currentUser, id, data})})`);
      this.permissieService.heeftToegang(currentUser, 'TypesGroepen.UpdateObject');
      this.heeftDataToegangUpdateObject(currentUser);
      bodyHeeftData(data);
      id = id ?? data.ID;

      const update = await this.normaliserenData(data) as Prisma.RefTypesGroepUncheckedUpdateInput;
      return await this.typesGroepenService.UpdateObject(id, update, currentUser.ID);
   }

   @HeliosDeleteObject()
   async DeleteObject(
      @CurrentUser() currentUser: RefLid,
      @Query('ID') id: number): Promise<void>
   {
      this.logger.verbose(`TypesGroepenController.DeleteObject(${safeStringify({currentUser, id})})`);
      this.permissieService.heeftToegang(currentUser, 'TypesGroepen.DeleteObject');
      this.heeftDataToegangDeleteObject(currentUser);

      const data: Prisma.RefTypesGroepUncheckedUpdateInput = {
         VERWIJDERD: true
      }
      await this.typesGroepenService.UpdateObject(id, data, currentUser.ID);
   }

   @HeliosRemoveObject()
   async RemoveObject(
      @CurrentUser() currentUser: RefLid,
      @Query('ID') id: number): Promise<void>
   {
      this.logger.verbose(`TypesGroepenController.RemoveObject(${safeStringify({currentUser, id})})`);
      this.permissieService.heeftToegang(currentUser, 'TypesGroepen.RemoveObject');
      this.heeftDataToegangRemoveObject(currentUser);
      await this.typesGroepenService.RemoveObject(id, currentUser.ID);
   }

   @HeliosRestoreObject()
   async RestoreObject(
      @CurrentUser() currentUser: RefLid,
      @Query('ID') id: number): Promise<void>
   {
      this.logger.verbose(`TypesGroepenController.RestoreObject(${safeStringify({currentUser, id})})`);
      this.permissieService.heeftToegang(currentUser, 'TypesGroepen.RestoreObject');
      this.heeftDataToegangRestoreObject(currentUser);

      const data: Prisma.RefTypesGroepUncheckedUpdateInput = {
         VERWIJDERD: false
      }
      await this.typesGroepenService.UpdateObject(id, data, currentUser.ID);
   }

   // gedeelde verwerking van AddObject en UpdateObject: verwijdert de niet-instelbare velden
   private async normaliserenData(
      data: CreateRefTypesGroepDto | UpdateRefTypesGroepDto): Promise<Prisma.RefTypesGroepUncheckedCreateInput | Prisma.RefTypesGroepUncheckedUpdateInput>
   {
      // VERWIJDERD, LAATSTE_AANPASSING en ID zijn nooit direct instelbaar door de client - ook al accepteert de
      // DTO ze (zodat een eerder opgehaald record ongewijzigd teruggestuurd kan worden), een meegegeven
      // waarde wordt hier altijd genegeerd
      delete data.VERWIJDERD;
      delete data.LAATSTE_AANPASSING;
      delete data.ID;

      return data as Prisma.RefTypesGroepUncheckedCreateInput | Prisma.RefTypesGroepUncheckedUpdateInput;
   }

   //------------- Specifieke endpoints staan hieronder --------------------//

   // controleer of de gebruiker toegang heeft tot de data van TypesGroepen/GetObject
   private heeftDataToegangGetObject(_currentUser: RefLid): void
   {
      // throw new HttpException("Geen toegang", HttpStatus.UNAUTHORIZED);
   }

   // controleer of de gebruiker toegang heeft tot de data van TypesGroepen/GetObjects
   private heeftDataToegangGetObjects(_currentUser: RefLid): void
   {
      // throw new HttpException("Geen toegang", HttpStatus.UNAUTHORIZED);
   }

   // controleer of de gebruiker toegang heeft tot de data van TypesGroepen/AddObject
   private heeftDataToegangAddObject(_currentUser: RefLid): void
   {
      // throw new HttpException("Geen toegang", HttpStatus.UNAUTHORIZED);
   }

   // controleer of de gebruiker toegang heeft tot de data van TypesGroepen/UpdateObject
   private heeftDataToegangUpdateObject(_currentUser: RefLid): void
   {
      // throw new HttpException("Geen toegang", HttpStatus.UNAUTHORIZED);
   }

   // controleer of de gebruiker toegang heeft tot de data van TypesGroepen/DeleteObject
   private heeftDataToegangDeleteObject(_currentUser: RefLid): void
   {
      // throw new HttpException("Geen toegang", HttpStatus.UNAUTHORIZED);
   }

   // controleer of de gebruiker toegang heeft tot de data van TypesGroepen/RemoveObject
   private heeftDataToegangRemoveObject(_currentUser: RefLid): void
   {
      // throw new HttpException("Geen toegang", HttpStatus.UNAUTHORIZED);
   }

   // controleer of de gebruiker toegang heeft tot de data van TypesGroepen/RestoreObject
   private heeftDataToegangRestoreObject(_currentUser: RefLid): void
   {
      // throw new HttpException("Geen toegang", HttpStatus.UNAUTHORIZED);
   }
}
