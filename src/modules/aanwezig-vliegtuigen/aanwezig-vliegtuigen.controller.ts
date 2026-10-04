import {Body, Controller, HttpStatus, Logger, Post, Query, UseGuards} from '@nestjs/common';
import {AanwezigVliegtuigenService} from "./aanwezig-vliegtuigen.service";
import {PermissieService} from "../authorisatie/permissie.service";
import {
   HeliosController,
   HeliosCreateObject, HeliosDeleteObject,
   HeliosGetObject,
   HeliosGetObjects, HeliosRemoveObject, HeliosRestoreObject,
   HeliosUpdateObject
} from "../../core/controllers/helios/helios.controller";
import {OperAanwezigVliegtuigDto} from "../../generated/nestjs-dto/operAanwezigVliegtuig.dto";
import {CurrentUser} from "../login/current-user.decorator";
import {Prisma, RefLid} from "@prisma/client";
import {GetObjectsOperAanwezigVliegtuigenResponse} from "./GetObjectsOperAanwezigVliegtuigenResponse";
import {GetObjectsOperAanwezigVliegtuigenRequest} from "./GetObjectsOperAanwezigVliegtuigenRequest";
import {IHeliosGetObjectsResponse} from "../../core/DTO/IHeliosGetObjectsResponse";
import {CreateOperAanwezigVliegtuigDto} from "../../generated/nestjs-dto/create-operAanwezigVliegtuig.dto";
import {UpdateOperAanwezigVliegtuigDto} from "../../generated/nestjs-dto/update-operAanwezigVliegtuig.dto";
import {ApiBasicAuth, ApiExtraModels, ApiOperation, ApiResponse, ApiTags, getSchemaPath} from "@nestjs/swagger";
import {AuthGuard} from "@nestjs/passport";
import {safeStringify} from "../../core/helpers/LogHelper";
import {bodyHeeftData} from "../../core/helpers/RequestGuards";
import {parseDateOnly, parseTimeOnly, toDateOnly, toTimeOnly} from "../../core/helpers/TimeDate";
import {AanmeldenVliegtuigRequest} from "./AanmeldenVliegtuigRequest";
import {AfmeldenVliegtuigRequest} from "./AfmeldenVliegtuigRequest";

@Controller('AanwezigVliegtuigen')
@ApiTags('AanwezigVliegtuigen')
export class AanwezigVliegtuigenController  extends HeliosController
{
   private readonly logger = new Logger(AanwezigVliegtuigenController.name);

   constructor(private readonly AanwezigVliegtuigenService: AanwezigVliegtuigenService,
               private readonly permissieService:PermissieService)
   {
      super()
   }

   @HeliosGetObject(OperAanwezigVliegtuigDto)
   async GetObject(
      @CurrentUser() currentUser: RefLid,
      @Query('ID') id: number): Promise<OperAanwezigVliegtuigDto>
   {
      this.logger.verbose(`AanwezigVliegtuigenController.GetObject(${safeStringify({currentUser, id})})`);
      this.permissieService.heeftToegang(currentUser, 'AanwezigVliegtuigen.GetObject');
      this.heeftDataToegangGetObject(currentUser);
      const obj = await this.AanwezigVliegtuigenService.GetObject(id);
      return {
         ...obj,
         DATUM: toDateOnly(obj.DATUM) as unknown as Date,
         AANKOMST: toTimeOnly(obj.AANKOMST) as unknown as Date,
         VERTREK: toTimeOnly(obj.VERTREK) as unknown as Date,
      };
   }

   @HeliosGetObjects(GetObjectsOperAanwezigVliegtuigenResponse)
   async GetObjects(
      @CurrentUser() currentUser: RefLid,
      @Query() queryParams: GetObjectsOperAanwezigVliegtuigenRequest): Promise<IHeliosGetObjectsResponse<GetObjectsOperAanwezigVliegtuigenResponse>>
   {
      this.logger.verbose(`AanwezigVliegtuigenController.GetObjects(${safeStringify({currentUser, queryParams})})`);
      this.permissieService.heeftToegang(currentUser, 'AanwezigVliegtuigen.GetObjects');
      this.heeftDataToegangGetObjects(currentUser);
      return await this.AanwezigVliegtuigenService.GetObjects(queryParams);
   }

   @HeliosCreateObject(CreateOperAanwezigVliegtuigDto, OperAanwezigVliegtuigDto)
   async AddObject(
      @CurrentUser() currentUser: RefLid,
      @Body() data: CreateOperAanwezigVliegtuigDto): Promise<OperAanwezigVliegtuigDto>
   {
      this.logger.verbose(`AanwezigVliegtuigenController.AddObject(${safeStringify({currentUser, data})})`);
      bodyHeeftData(data);
      this.permissieService.heeftToegang(currentUser, 'AanwezigVliegtuigen.AddObject');
      this.heeftDataToegangAddObject(currentUser);

      const insert = await this.normaliserenData(data) as Prisma.OperAanwezigVliegtuigUncheckedCreateInput;
      const obj = await this.AanwezigVliegtuigenService.AddObject(insert, currentUser.ID);
      return {
         ...obj,
         DATUM: toDateOnly(obj.DATUM) as unknown as Date,
         AANKOMST: toTimeOnly(obj.AANKOMST) as unknown as Date,
         VERTREK: toTimeOnly(obj.VERTREK) as unknown as Date,
      };
   }

   @HeliosUpdateObject(UpdateOperAanwezigVliegtuigDto, OperAanwezigVliegtuigDto)
   async UpdateObject(
      @CurrentUser() currentUser: RefLid,
      @Query('ID') id: number, @Body() data: UpdateOperAanwezigVliegtuigDto): Promise<OperAanwezigVliegtuigDto>
   {
      bodyHeeftData(data);
      id = id ?? data.ID;
      this.logger.verbose(`AanwezigVliegtuigenController.UpdateObject(${safeStringify({currentUser, id, data})})`);
      this.permissieService.heeftToegang(currentUser, 'AanwezigVliegtuigen.UpdateObject');
      this.heeftDataToegangUpdateObject(currentUser);

      const update = await this.normaliserenData(data) as Prisma.OperAanwezigVliegtuigUncheckedUpdateInput;
      const obj = await this.AanwezigVliegtuigenService.UpdateObject(id, update, currentUser.ID);
      return {
         ...obj,
         DATUM: toDateOnly(obj.DATUM) as unknown as Date,
         AANKOMST: toTimeOnly(obj.AANKOMST) as unknown as Date,
         VERTREK: toTimeOnly(obj.VERTREK) as unknown as Date,
      };
   }

   @HeliosDeleteObject()
   async DeleteObject(
      @CurrentUser() currentUser: RefLid,
      @Query('ID') id: number): Promise<void>
   {
      this.logger.verbose(`AanwezigVliegtuigenController.DeleteObject(${safeStringify({currentUser, id})})`);
      this.permissieService.heeftToegang(currentUser, 'AanwezigVliegtuigen.DeleteObject');
      this.heeftDataToegangDeleteObject(currentUser);

      const data: Prisma.OperAanwezigVliegtuigUncheckedUpdateInput = {
         VERWIJDERD: true
      }
      await this.AanwezigVliegtuigenService.UpdateObject(id, data, currentUser.ID);
   }

   @HeliosRemoveObject()
   async RemoveObject(
      @CurrentUser() currentUser: RefLid,
      @Query('ID') id: number): Promise<void>
   {
      this.logger.verbose(`AanwezigVliegtuigenController.RemoveObject(${safeStringify({currentUser, id})})`);
      this.permissieService.heeftToegang(currentUser, 'AanwezigVliegtuigen.RemoveObject');
      this.heeftDataToegangRemoveObject(currentUser);
      await this.AanwezigVliegtuigenService.RemoveObject(id, currentUser.ID);
   }

   @HeliosRestoreObject()
   async RestoreObject(
      @CurrentUser() currentUser: RefLid,
      @Query('ID') id: number): Promise<void>
   {
      this.logger.verbose(`AanwezigVliegtuigenController.RestoreObject(${safeStringify({currentUser, id})})`);
      this.permissieService.heeftToegang(currentUser, 'AanwezigVliegtuigen.RestoreObject');
      this.heeftDataToegangRestoreObject(currentUser);

      const data: Prisma.OperAanwezigVliegtuigUncheckedUpdateInput = {
         VERWIJDERD: false
      }
      await this.AanwezigVliegtuigenService.UpdateObject(id, data, currentUser.ID);
   }

   //------------- Specifieke endpoints staan hieronder --------------------//

   @Post("Aanmelden")
   @ApiBasicAuth()
   @UseGuards(AuthGuard(['jwt', 'basic-auth']))
   @ApiExtraModels(OperAanwezigVliegtuigDto)
   @ApiOperation({summary: 'Aanmelden van een vliegtuig als aanwezig. Maakt een nieuw record aan, of past de bestaande aanmelding van dat vliegtuig op die dag aan.'})
   @ApiResponse({status: HttpStatus.BAD_REQUEST, description: 'Verkeerde input data.'})
   @ApiResponse({status: HttpStatus.UNAUTHORIZED, description: 'Geen toegang.'})
   @ApiResponse({status: HttpStatus.NOT_ACCEPTABLE, description: 'VLIEGTUIG_ID ontbreekt.'})
   @ApiResponse({status: HttpStatus.OK, description: 'Aanmelding verwerkt.', schema: {'$ref': getSchemaPath(OperAanwezigVliegtuigDto)}})
   async Aanmelden(
      @CurrentUser() currentUser: RefLid,
      @Body() data: AanmeldenVliegtuigRequest): Promise<OperAanwezigVliegtuigDto>
   {
      this.logger.verbose(`AanwezigVliegtuigenController.Aanmelden(${safeStringify({currentUser, data})})`);
      bodyHeeftData(data);
      this.permissieService.heeftToegang(currentUser, 'AanwezigVliegtuigen.Aanmelden');
      this.heeftDataToegangAanmelden(currentUser);

      const obj = await this.AanwezigVliegtuigenService.Aanmelden(data, currentUser.ID);
      return {
         ...obj,
         DATUM: toDateOnly(obj.DATUM) as unknown as Date,
         AANKOMST: toTimeOnly(obj.AANKOMST) as unknown as Date,
         VERTREK: toTimeOnly(obj.VERTREK) as unknown as Date,
      };
   }

   @Post("Afmelden")
   @ApiBasicAuth()
   @UseGuards(AuthGuard(['jwt', 'basic-auth']))
   @ApiExtraModels(OperAanwezigVliegtuigDto)
   @ApiOperation({summary: 'Afmelden van een aangemeld vliegtuig.'})
   @ApiResponse({status: HttpStatus.BAD_REQUEST, description: 'Verkeerde input data.'})
   @ApiResponse({status: HttpStatus.UNAUTHORIZED, description: 'Geen toegang.'})
   @ApiResponse({status: HttpStatus.NOT_ACCEPTABLE, description: 'VLIEGTUIG_ID ontbreekt.'})
   @ApiResponse({status: HttpStatus.CONFLICT, description: 'Vliegtuig is niet aangemeld.'})
   @ApiResponse({status: HttpStatus.OK, description: 'Afmelding verwerkt.', schema: {'$ref': getSchemaPath(OperAanwezigVliegtuigDto)}})
   async Afmelden(
      @CurrentUser() currentUser: RefLid,
      @Body() data: AfmeldenVliegtuigRequest): Promise<OperAanwezigVliegtuigDto>
   {
      this.logger.verbose(`AanwezigVliegtuigenController.Afmelden(${safeStringify({currentUser, data})})`);
      bodyHeeftData(data);
      this.permissieService.heeftToegang(currentUser, 'AanwezigVliegtuigen.Afmelden');
      this.heeftDataToegangAfmelden(currentUser);

      const obj = await this.AanwezigVliegtuigenService.Afmelden(data, currentUser.ID);
      return {
         ...obj,
         DATUM: toDateOnly(obj.DATUM) as unknown as Date,
         AANKOMST: toTimeOnly(obj.AANKOMST) as unknown as Date,
         VERTREK: toTimeOnly(obj.VERTREK) as unknown as Date,
      };
   }

   // gedeelde verwerking van AddObject en UpdateObject: verwijdert de niet-instelbare velden en normaliseert
   // de datum- en tijdvelden
   private async normaliserenData(
      data: CreateOperAanwezigVliegtuigDto | UpdateOperAanwezigVliegtuigDto): Promise<Prisma.OperAanwezigVliegtuigUncheckedCreateInput | Prisma.OperAanwezigVliegtuigUncheckedUpdateInput>
   {
      // VERWIJDERD, LAATSTE_AANPASSING en ID zijn nooit direct instelbaar door de client - ook al accepteert de
      // DTO ze (zodat een eerder opgehaald record ongewijzigd teruggestuurd kan worden), een meegegeven
      // waarde wordt hier altijd genegeerd
      delete data.VERWIJDERD;
      delete data.LAATSTE_AANPASSING;
      delete data.ID;

      data.DATUM = parseDateOnly(data.DATUM as Date | string) as Date;
      data.AANKOMST = parseTimeOnly(data.AANKOMST as Date | string | null);
      data.VERTREK = parseTimeOnly(data.VERTREK as Date | string | null);

      return data as Prisma.OperAanwezigVliegtuigUncheckedCreateInput | Prisma.OperAanwezigVliegtuigUncheckedUpdateInput;
   }

   // controleer of de gebruiker toegang heeft tot de data van AanwezigVliegtuigen/GetObject
   private heeftDataToegangGetObject(_currentUser: RefLid): void
   {
      // throw new HttpException("Geen toegang", HttpStatus.UNAUTHORIZED);
   }

   // controleer of de gebruiker toegang heeft tot de data van AanwezigVliegtuigen/GetObjects
   private heeftDataToegangGetObjects(_currentUser: RefLid): void
   {
      // throw new HttpException("Geen toegang", HttpStatus.UNAUTHORIZED);
   }

   // controleer of de gebruiker toegang heeft tot de data van AanwezigVliegtuigen/AddObject
   private heeftDataToegangAddObject(_currentUser: RefLid): void
   {
      // throw new HttpException("Geen toegang", HttpStatus.UNAUTHORIZED);
   }

   // controleer of de gebruiker toegang heeft tot de data van AanwezigVliegtuigen/UpdateObject
   private heeftDataToegangUpdateObject(_currentUser: RefLid): void
   {
      // throw new HttpException("Geen toegang", HttpStatus.UNAUTHORIZED);
   }

   // controleer of de gebruiker toegang heeft tot de data van AanwezigVliegtuigen/DeleteObject
   private heeftDataToegangDeleteObject(_currentUser: RefLid): void
   {
      // throw new HttpException("Geen toegang", HttpStatus.UNAUTHORIZED);
   }

   // controleer of de gebruiker toegang heeft tot de data van AanwezigVliegtuigen/RemoveObject
   private heeftDataToegangRemoveObject(_currentUser: RefLid): void
   {
      // throw new HttpException("Geen toegang", HttpStatus.UNAUTHORIZED);
   }

   // controleer of de gebruiker toegang heeft tot de data van AanwezigVliegtuigen/RestoreObject
   private heeftDataToegangRestoreObject(_currentUser: RefLid): void
   {
      // throw new HttpException("Geen toegang", HttpStatus.UNAUTHORIZED);
   }

   // controleer of de gebruiker toegang heeft tot de data van AanwezigVliegtuigen/Aanmelden
   private heeftDataToegangAanmelden(_currentUser: RefLid): void
   {
      // throw new HttpException("Geen toegang", HttpStatus.UNAUTHORIZED);
   }

   // controleer of de gebruiker toegang heeft tot de data van AanwezigVliegtuigen/Afmelden
   private heeftDataToegangAfmelden(_currentUser: RefLid): void
   {
      // throw new HttpException("Geen toegang", HttpStatus.UNAUTHORIZED);
   }
}
