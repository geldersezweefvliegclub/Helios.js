import {
   Body,
   Controller,
   HttpException,
   HttpStatus,
   Query
} from '@nestjs/common';
import {Prisma, RefLid} from '@prisma/client';
import {IHeliosGetObjectsResponse} from "../../core/DTO/IHeliosGetObjectsReponse";
import {GetObjectRequest} from "../../core/DTO/IHeliosFilter";
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
import {ApiTags} from "@nestjs/swagger";
import {authenticator } from 'otplib';
import {ConfigService} from "@nestjs/config";
import {CurrentUser} from "../login/current-user.decorator";
import {PermissieService} from "../authorisatie/permissie.service";

@Controller('Leden')
@ApiTags('Leden')
export class LedenController extends HeliosController
{
   constructor(private readonly configService: ConfigService,
               private readonly ledenService: LedenService,
               private readonly permissieService:PermissieService)
   {
      super()
   }

   @HeliosGetObject(RefLidDto)
   async GetObject(
      @CurrentUser() user: RefLid,
      @Query() queryParams: GetObjectRequest): Promise<RefLidDto>
   {
      this.permissieService.heeftToegang(user, 'Leden.GetObject');
      const obj =  await this.ledenService.GetObject(queryParams.ID);
      if (!obj)
         throw new HttpException(`Record with ID ${queryParams.ID} not found`, HttpStatus.NOT_FOUND);

      return this.privacyMask(obj, user);
   }

   @HeliosGetObjects(GetObjectsRefLedenResponse)
   async GetObjects(
      @CurrentUser() user: RefLid,
      @Query() queryParams: GetObjectsRefLedenRequest): Promise<IHeliosGetObjectsResponse<GetObjectsRefLedenResponse>>
   {
      // check if the user has the right permissions
      this.permissieService.heeftToegang(user, 'Leden.GetObjects');

      if (!this.permissieService.isBeheerderDDWV(user) && !this.permissieService.isBeheerder(user) && !this.permissieService.isStarttoren(user)) {
         // 600 = Student
         // 601 = Erelid
         // 602 = Lid
         // 603 = Jeugdlid
         // 604 = private owner
         // 605 = veteraan
         // 606 = Donateur
         // 625 = DDWV
         queryParams.TYPES = queryParams.TYPES ?? [];          // if TYPES is not set, set it to an empty array
         queryParams.TYPES.push(601,602,603,604,605,606,625);  // add filter for normale leden
      }

      // retrieve the objects from the database based on the query parameters
      const objs = await this.ledenService.GetObjects (queryParams);

      // remove the privacy sensitive data in the response, also extra fields
      objs.dataset = objs.dataset.map(obj => this.privacyMaskGetObjects (obj, user));
      return objs;
   }

   @HeliosCreateObject(CreateRefLidDto, RefLidDto)
   async AddObject(
      @CurrentUser() user: RefLid,
      @Body() data: CreateRefLidDto): Promise<RefLidDto>
   {
      this.permissieService.heeftToegang(user, 'Leden.AddObject');
      try
      {
         // remove LIDTYPE_ID, STATUSTYPE_ID, ZUSTERCLUB_ID, BUDDY_ID, BUDDY_ID2 from the data
         // and add them as connect to the insertData object
         const { LIDTYPE_ID, STATUSTYPE_ID, ZUSTERCLUB_ID, BUDDY_ID, BUDDY_ID2, ...insertData} = data;
         (insertData as Prisma.RefLidCreateInput).LidType = (LIDTYPE_ID !== undefined) ? { connect: {ID: LIDTYPE_ID }} : undefined;
         (insertData as Prisma.RefLidCreateInput).VliegStatus = (STATUSTYPE_ID !== undefined) ? { connect: {ID: STATUSTYPE_ID }} : undefined;
         (insertData as Prisma.RefLidCreateInput).Zusterclub = (ZUSTERCLUB_ID !== undefined) ? { connect: {ID: ZUSTERCLUB_ID }} : undefined;
         (insertData as Prisma.RefLidCreateInput).Buddy = (BUDDY_ID !== undefined) ? { connect: {ID: BUDDY_ID }} : undefined;
         (insertData as Prisma.RefLidCreateInput).Buddy2 = (BUDDY_ID2 !== undefined) ? { connect: {ID: BUDDY_ID2 }} : undefined;

         return await this.ledenService.AddObject(insertData as Prisma.RefLidCreateInput);
      }
      catch (e)
      {
         this.handlePrismaError(e)
      }
   }

   @HeliosUpdateObject(UpdateRefLidDto, RefLidDto)
   async UpdateObject(
      @CurrentUser() user: RefLid,
      @Query('ID') id: number, @Body() data: UpdateRefLidDto): Promise<RefLid>
   {
      this.permissieService.heeftToegang(user, 'Leden.UpdateObject');
      if ((user.ID !== id) && !this.permissieService.isBeheerder(user) && !this.permissieService.isBeheerderDDWV(user)) {
         throw new HttpException(`Niet toegestaan om ander lid te wijzigen`, HttpStatus.UNAUTHORIZED);
      }

      try
      {
         // remove LIDTYPE_ID, STATUSTYPE_ID, ZUSTERCLUB_ID, BUDDY_ID, BUDDY_ID2 from the data
         // and add them as connect to the updateData object
         const { LIDTYPE_ID, STATUSTYPE_ID, ZUSTERCLUB_ID, BUDDY_ID, BUDDY_ID2, ...updateData} = data;
         (updateData as Prisma.RefLidCreateInput).LidType = LIDTYPE_ID ? { connect: {ID: LIDTYPE_ID }} : undefined;
         (updateData as Prisma.RefLidCreateInput).VliegStatus = STATUSTYPE_ID ? { connect: {ID: STATUSTYPE_ID }} : undefined;
         (updateData as Prisma.RefLidCreateInput).Zusterclub = ZUSTERCLUB_ID ? { connect: {ID: ZUSTERCLUB_ID }} : undefined;
         (updateData as Prisma.RefLidCreateInput).Buddy = BUDDY_ID ? { connect: {ID: BUDDY_ID }} : undefined;
         (updateData as Prisma.RefLidCreateInput).Buddy2 = BUDDY_ID2 ? { connect: {ID: BUDDY_ID2 }} : undefined;

         return await this.ledenService.UpdateObject(id, updateData as Prisma.RefLidUpdateInput);
      }
      catch (e)
      {
         this.handlePrismaError(e)
      }
   }

   @HeliosDeleteObject()
   async DeleteObject(
      @CurrentUser() user: RefLid,
      @Query('ID') id: number): Promise<void>
   {
      this.permissieService.heeftToegang(user, 'Leden.DeleteObject');

      const data: Prisma.RefLidUpdateInput = {
         VERWIJDERD: true
      }
      try
      {
         await this.ledenService.UpdateObject(id, data);
      }
      catch (e)
      {
         this.handlePrismaError(e)
      }
   }

   @HeliosRemoveObject()
   async RemoveObject(
      @CurrentUser() user: RefLid,
      @Query('ID') id: number): Promise<void>
   {
      this.permissieService.heeftToegang(user, 'Leden.RemoveObject');

      try
      {
         await this.ledenService.RemoveObject(id);
      }
      catch (e)
      {
         this.handlePrismaError(e)
      }
   }

   @HeliosRestoreObject()
   async RestoreObject(
      @CurrentUser() user: RefLid,
      @Query('ID') id: number): Promise<void>
   {
      this.permissieService.heeftToegang(user, 'Leden.RestoreObject');

      const data: Prisma.RefLidUpdateInput = {
         VERWIJDERD: false
      }
      await this.ledenService.UpdateObject(id, data);
   }


   // remove the privacy sensitive data in the response
   privacyMask(obj: RefLid, user: RefLid): RefLid
   {
      if ((user.ID === obj.ID) || this.permissieService.isBeheerder(user)) {
         obj.SECRET = authenticator.keyuri(obj.INLOGNAAM, this.configService.get('Authenticator.Vereniging'), obj.SECRET);
      }
      else {
         // remove the secret info from the response
         obj.INLOGNAAM = undefined;
         obj.SECRET = undefined;
         obj.WACHTWOORD = undefined;
         obj.AUTH = false;
      }

      // startverbod mag alleen door beheerder, instructeur of CIMT worden gezien. Of door het lid natuurlijk
      if (!this.permissieService.isBeheerder(user) &&
          !this.permissieService.isInstructeur(user) &&
          !this.permissieService.isCIMT(user) && (obj.ID !== user.ID)) {
         obj.STARTVERBOD = false;
      }

      // brevetnummer, knvvl nummer & zusterclub is alleen zichtbaar voor beheerders en beheerders DDWV, of het lid zelf
      if (!this.permissieService.isBeheerder(user) &&
          !this.permissieService.isBeheerderDDWV(user) &&
          !this.permissieService.isCIMT(user) && (obj.ID !== user.ID)) {
         obj.BREVET_NUMMER = undefined;
         obj.KNVVL_LIDNUMMER = undefined;
         obj.ZUSTERCLUB_ID = undefined;
      }

      // tegoed is alleen intressant voor beheerders en beheerders DDWV, of het lid zelf
      if (!this.permissieService.isBeheerder(user) &&
         !this.permissieService.isBeheerderDDWV(user) && (obj.ID !== user.ID)) {
         obj.TEGOED = undefined;
      }

      // buddy is alleen zichtbaar voor beheerders, instructeurs en CIMT, of het lid zelf
      if (!this.permissieService.isBeheerder(user) &&
          !this.permissieService.isInstructeur(user) &&
          !this.permissieService.isCIMT(user) && (obj.ID !== user.ID)) {
         obj.BUDDY_ID = undefined;
         obj.BUDDY_ID2 = undefined;

         // starttoren heeeft medical info nodig
         if (!this.permissieService.isStarttoren(user)) {
            obj.MEDICAL = undefined
         }
      }

      // als gebruiker privacy settings heeft, dan worden de gegevens gemaskeerd
      if (this.permissieService.hasPrivacy(user) && (obj.ID !== user.ID))
      {
         // check if the user has privacy settings enabled
         // if the user is a beheerder, beheerder DDWV, instructeur or CIMT, the privacy settings are ignored
         obj.ADRES = "****";
         obj.POSTCODE = "****";
         obj.WOONPLAATS = "****";
         obj.TELEFOON = undefined
         obj.MOBIEL = undefined
         obj.NOODNUMMER = undefined
         obj.GEBOORTE_DATUM = undefined
         obj.AVATAR = undefined;
         obj.LIDNR = undefined;
         obj.STATUSTYPE_ID = undefined;
      }

      return  obj as RefLid
   }

   privacyMaskGetObjects(obj: GetObjectsRefLedenResponse, user: RefLid): GetObjectsRefLedenResponse
   {
      const responseObj = this.privacyMask(obj, user) as GetObjectsRefLedenResponse;

      responseObj.BUDDY       = responseObj.BUDDY_ID ? obj.BUDDY : undefined;
      responseObj.BUDDY2      = responseObj.BUDDY_ID2 ? obj.BUDDY2 : undefined;
      responseObj.LIDTYPE     = responseObj.LIDTYPE_ID ? obj.LIDTYPE : undefined;
      responseObj.STATUS      = responseObj.STATUSTYPE_ID ? obj.STATUS : undefined;
      responseObj.LIDTYPE_REF = responseObj.LIDTYPE_ID ? obj.LIDTYPE_REF : undefined;
      responseObj.ZUSTERCLUB  = responseObj.ZUSTERCLUB_ID ? obj.ZUSTERCLUB : undefined;

      return responseObj;
   }
}
