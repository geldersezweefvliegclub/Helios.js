import {
   Body,
   Controller, Get,
   HttpException,
   HttpStatus,
   Logger,
   Query, UseGuards
} from '@nestjs/common';
import {Prisma, RefLid} from '@prisma/client';
import {IHeliosGetObjectsResponse} from "../../core/DTO/IHeliosGetObjectsResponse";
import {
   HeliosController, HeliosCreateObject, HeliosDeleteObject,
   HeliosGetObject, HeliosGetObjects, HeliosRemoveObject,
   HeliosRestoreObject, HeliosUpdateObject
} from "../../core/controllers/helios/helios.controller";
import {LedenService} from "./leden.service";
import {RefLidDto} from "../../generated/nestjs-dto/refLid.dto";
import { GetObjectsRefLedenRequest} from "./GetObjectsRefLedenRequest";
import {CreateRefLidDto} from "../../generated/nestjs-dto/create-refLid.dto";
import {UpdateRefLidDto} from "../../generated/nestjs-dto/update-refLid.dto";
import {GetObjectsRefLedenResponse} from "./GetObjectsRefLedenResponse";
import {ApiBasicAuth, ApiExtraModels, ApiOperation, ApiResponse, ApiTags, getSchemaPath} from "@nestjs/swagger";
import {authenticator } from 'otplib';
import {ConfigService} from "@nestjs/config";
import {CurrentUser} from "../login/current-user.decorator";
import {PermissieService} from "../authorisatie/permissie.service";
import {AuthGuard} from "@nestjs/passport";
import {VerjaardagenResponse} from "./VerjaardagenResponse";
import {LidType} from "../../core/enums/LidType";
import {safeStringify} from "../../core/helpers/LogHelper";

@Controller('Leden')
@ApiTags('Leden')
export class LedenController extends HeliosController
{
   private readonly logger = new Logger(LedenController.name);

   constructor(private readonly configService: ConfigService,
               private readonly ledenService: LedenService,
               private readonly permissieService:PermissieService)
   {
      super()
   }

   @HeliosGetObject(RefLidDto)
   async GetObject(
      @CurrentUser() currentUser: RefLid,
      @Query('ID') id: number): Promise<RefLidDto>
   {
      this.logger.verbose(`LedenController.GetObject(${safeStringify({currentUser, id})})`);
      this.permissieService.heeftToegang(currentUser, 'Leden.GetObject');
      const obj =  await this.ledenService.GetObject(id);
      return this.privacyMask(obj, currentUser);
   }

   @HeliosGetObjects(GetObjectsRefLedenResponse)
   async GetObjects(
      @CurrentUser() currentUser: RefLid,
      @Query() queryParams: GetObjectsRefLedenRequest): Promise<IHeliosGetObjectsResponse<GetObjectsRefLedenResponse>>
   {
      this.logger.verbose(`LedenController.GetObjects(${safeStringify({currentUser, queryParams})})`);
      // controleer of de gebruiker de juiste rechten heeft
      this.permissieService.heeftToegang(currentUser, 'Leden.GetObjects');

      if (!this.permissieService.isBeheerderDDWV(currentUser) && !this.permissieService.isBeheerder(currentUser) && !this.permissieService.isStarttoren(currentUser)) {
         queryParams.TYPES = queryParams.TYPES ?? [];          // als TYPES niet is opgegeven, zet het op een lege array
         queryParams.TYPES.push(       // voeg filter toe voor normale leden
            LidType.Student, LidType.Erelid, LidType.Lid, LidType.Jeugdlid,
            LidType.PrivateOwner, LidType.Veteraan, LidType.Donateur, LidType.DDWV,
         );
      }

      // haal de objects op uit de database op basis van de query parameters
      const objs = await this.ledenService.GetObjects (queryParams);

      // verwijder de privacygevoelige data uit de response, ook extra velden

      objs.dataset = objs.dataset.map(obj => this.privacyMask(obj, currentUser) as GetObjectsRefLedenResponse);
      return objs;
   }

   @HeliosCreateObject(CreateRefLidDto, RefLidDto)
   async AddObject(
      @CurrentUser() currentUser: RefLid,
      @Body() data: CreateRefLidDto): Promise<RefLidDto>
   {
      this.logger.verbose(`LedenController.AddObject(${safeStringify({currentUser, data})})`);
      this.permissieService.heeftToegang(currentUser, 'Leden.AddObject');

      // verwijder LIDTYPE_ID, STATUSTYPE_ID, ZUSTERCLUB_ID, BUDDY_ID, BUDDY_ID2 uit de data
      // en voeg ze toe als connect aan het insertData object
      const { LIDTYPE_ID, STATUSTYPE_ID, ZUSTERCLUB_ID, BUDDY_ID, BUDDY_ID2, ...insertData} = data;
      const connect = (id?: number) => id !== undefined ? { connect: { ID: id } } : undefined;
      const insert = insertData as Prisma.RefLidCreateInput;
      insert.LidType = connect(LIDTYPE_ID);
      insert.VliegStatus = connect(STATUSTYPE_ID);
      insert.Zusterclub = connect(ZUSTERCLUB_ID);
      insert.Buddy = connect(BUDDY_ID);
      insert.Buddy2 = connect(BUDDY_ID2);

      return await this.ledenService.AddObject(insert);
   }

   @HeliosUpdateObject(UpdateRefLidDto, RefLidDto)
   async UpdateObject(
      @CurrentUser() currentUser: RefLid,
      @Query('ID') id: number, @Body() data: UpdateRefLidDto): Promise<RefLid>
   {
      this.logger.verbose(`LedenController.UpdateObject(${safeStringify({currentUser, id, data})})`);
      this.permissieService.heeftToegang(currentUser, 'Leden.UpdateObject');
      if ((currentUser.ID !== id) && !this.permissieService.isBeheerder(currentUser) && !this.permissieService.isBeheerderDDWV(currentUser)) {
         throw new HttpException(`Niet toegestaan om ander lid te wijzigen`, HttpStatus.UNAUTHORIZED);
      }

      // verwijder LIDTYPE_ID, STATUSTYPE_ID, ZUSTERCLUB_ID, BUDDY_ID, BUDDY_ID2 uit de data
      // en voeg ze toe als connect aan het updateData object
      const { LIDTYPE_ID, STATUSTYPE_ID, ZUSTERCLUB_ID, BUDDY_ID, BUDDY_ID2, ...updateData} = data;
      const connect = (id?: number) => id ? { connect: { ID: id } } : undefined;
      const update = updateData as Prisma.RefLidUpdateInput;
      update.LidType = connect(LIDTYPE_ID);
      update.VliegStatus = connect(STATUSTYPE_ID);
      update.Zusterclub = connect(ZUSTERCLUB_ID);
      update.Buddy = connect(BUDDY_ID);
      update.Buddy2 = connect(BUDDY_ID2);

      return await this.ledenService.UpdateObject(id, update);
   }

   @HeliosDeleteObject()
   async DeleteObject(
      @CurrentUser() currentUser: RefLid,
      @Query('ID') id: number): Promise<void>
   {
      this.logger.verbose(`LedenController.DeleteObject(${safeStringify({currentUser, id})})`);
      this.permissieService.heeftToegang(currentUser, 'Leden.DeleteObject');

      const data: Prisma.RefLidUpdateInput = {
         VERWIJDERD: true
      }
      await this.ledenService.UpdateObject(id, data);
   }

   @HeliosRemoveObject()
   async RemoveObject(
      @CurrentUser() currentUser: RefLid,
      @Query('ID') id: number): Promise<void>
   {
      this.logger.verbose(`LedenController.RemoveObject(${safeStringify({currentUser, id})})`);
      this.permissieService.heeftToegang(currentUser, 'Leden.RemoveObject');
      if (currentUser.ID === id) {
         throw new HttpException(`Je kunt jezelf niet verwijderen`, HttpStatus.UNAUTHORIZED);
      }
      await this.ledenService.RemoveObject(id, currentUser.ID);
   }

   @HeliosRestoreObject()
   async RestoreObject(
      @CurrentUser() currentUser: RefLid,
      @Query('ID') id: number): Promise<void>
   {
      this.logger.verbose(`LedenController.RestoreObject(${safeStringify({currentUser, id})})`);
      this.permissieService.heeftToegang(currentUser, 'Leden.RestoreObject');

      const data: Prisma.RefLidUpdateInput = {
         VERWIJDERD: false
      }
      await this.ledenService.UpdateObject(id, data);
   }


   // verwijder de privacygevoelige data uit de response
   privacyMask(obj: RefLid, currentUser: RefLid): RefLid
   {
      const ikBenHetZelf = this.permissieService.ikBenHetZelf(obj, currentUser);
      const isBeheerder = this.permissieService.isBeheerder(currentUser);
      const isBeheerderDDWV = this.permissieService.isBeheerderDDWV(currentUser);
      const isInstructeur = this.permissieService.isInstructeur(currentUser);
      const isCIMT = this.permissieService.isCIMT(currentUser);
      const isStarttoren = this.permissieService.isStarttoren(currentUser);

      this.logger.verbose(`LedenController.privacyMask(${safeStringify({obj, currentUser})})`);
      if (ikBenHetZelf || isBeheerder || isInstructeur) {
          obj.SECRET = authenticator.keyuri(obj.INLOGNAAM, this.configService.get('Authenticator.Vereniging'), obj.SECRET);
      }
      else {
         // verwijder de geheime info uit de response
         obj.INLOGNAAM = null;
         obj.SECRET = null;
         obj.WACHTWOORD = null;
         obj.AUTH = false;
      }

      // startverbod mag alleen door beheerder, instructeur of CIMT worden gezien. Of door het lid zelf natuurlijk
      if (!isBeheerder &&  !isInstructeur && !isCIMT && !ikBenHetZelf) {
         obj.STARTVERBOD = false;
      }

      // brevetnummer, knvvl nummer & zusterclub is alleen zichtbaar voor beheerders en beheerders DDWV, of het lid zelf
      if (!isBeheerder && !isBeheerderDDWV && !isCIMT && !ikBenHetZelf) {
         obj.BREVET_NUMMER = null;
         obj.KNVVL_LIDNUMMER = null;
         obj.ZUSTERCLUB_ID = null;
      }

      // tegoed is alleen intressant voor beheerders en beheerders DDWV, of het lid zelf
      if (!isBeheerder && !isBeheerderDDWV && !ikBenHetZelf) {
         obj.TEGOED = null;
      }

      // buddy is alleen zichtbaar voor beheerders, instructeurs en CIMT, of het lid zelf
      if (!isBeheerder && !isInstructeur && !isCIMT && !ikBenHetZelf) {
          obj.BUDDY_ID = null;
          obj.BUDDY_ID2 = null;
      }

      // medical is alleen zichtbaar voor beheerders, instructeurs, CIMT, starttoren, of het lid zelf
      if (!isBeheerder && !isInstructeur && !isCIMT && !ikBenHetZelf && !isStarttoren) {
          obj.MEDICAL = null
      }

      // als gebruiker privacy settings heeft, dan worden de gegevens gemaskeerd
      if (this.permissieService.hasPrivacy(currentUser) && !ikBenHetZelf)
      {
         // controleer of de gebruiker privacy-instellingen heeft ingeschakeld
         // als de gebruiker een beheerder, beheerder DDWV, instructeur of CIMT is, worden de privacy-instellingen genegeerd
         obj.ADRES = "****";
         obj.POSTCODE = "****";
         obj.WOONPLAATS = "****";
         obj.TELEFOON = null
         obj.MOBIEL = null
         obj.NOODNUMMER = null
         obj.GEBOORTE_DATUM = null
         obj.AVATAR = null;
         obj.LIDNR = null;
         obj.STATUSTYPE_ID = null;
      }

      return obj as RefLid;
   }


   //------------- Specifieke endpoints staan hieronder --------------------//

   @Get("Verjaardagen")
   @ApiExtraModels(VerjaardagenResponse)
   @ApiBasicAuth()
   @UseGuards(AuthGuard(['jwt', 'basic-auth']))
   @ApiOperation({ summary: 'Komende verjaardagen.' })
   @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Verkeerde input data.' })
   @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Geen toegang.' })
   @ApiResponse({ status: HttpStatus.OK, description: 'Data opgehaald.',   schema: {
         type: 'object',
         properties:
            {
               items: {$ref: getSchemaPath(VerjaardagenResponse)},

            }
      }})
   async GetVerjaardagen(
      @CurrentUser() currentUser: RefLid,
      @Query('AANTAL') aantal?: number): Promise<VerjaardagenResponse[]>
   {
      this.logger.verbose(`LedenController.GetVerjaardagen(${safeStringify({currentUser, aantal})})`);
      this.permissieService.heeftToegang(currentUser, 'Leden.GetVerjaardagen');
      return await this.ledenService.GetVerjaardagen(aantal);
   }
}
