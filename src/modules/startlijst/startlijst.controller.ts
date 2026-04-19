import {Controller, Get, HttpStatus, Query, UseGuards} from '@nestjs/common';
import {ApiBasicAuth, ApiExtraModels, ApiOperation, ApiResponse, ApiTags} from '@nestjs/swagger';
import {AuthGuard} from '@nestjs/passport';
import {HeliosController} from '../../core/controllers/helios/helios.controller';
import {PermissieService} from '../authorisatie/permissie.service';
import {CurrentUser} from '../login/current-user.decorator';
import {RefLid} from '@prisma/client';
import {GetObjectRequest} from '../../core/DTO/IHeliosFilter';
import {GetLogboekRequest} from './GetLogboekRequest';
import {GetLogboekTotalenRequest} from './GetLogboekTotalenRequest';
import {GetObjectsStartlijstRequest} from './GetObjectsStartlijstRequest';
import {GetRecencyRequest} from './GetRecencyRequest';
import {GetVliegtuigLogboekRequest} from './GetVliegtuigLogboekRequest';
import {GetVliegtuigLogboekTotalenRequest} from './GetVliegtuigLogboekTotalenRequest';
import {GetVliegDagenRequest} from './GetVliegDagenRequest';
import {
   GetObjectsStartlijstResponse,
   GetObjectsStartlijstRowResponse,
   GetLogboekResponse,
   GetLogboekRowResponse,
   GetLogboekTotalenResponse,
   GetRecencyResponse,
   GetVliegDagenResponse,
   GetVliegDagenRowResponse,
   GetVliegtuigLogboekRowResponse,
   GetVliegtuigLogboekResponse,
   GetVliegtuigLogboekTotaalRowResponse,
   GetVliegtuigLogboekTotalenResponse,
   JaarTotaalResponse,
   StartlijstObjectResponse,
   StartMethodeTotaalResponse,
   VliegtuigMaandTotalenResponse,
   VliegtuigTotaalResponse,
} from './startlijst.responses';
import {StartlijstService} from './startlijst.service';

@Controller('Startlijst')
@ApiTags('Startlijst')
@ApiBasicAuth()
@ApiExtraModels(
   StartlijstObjectResponse,
   GetObjectsStartlijstResponse,
   GetObjectsStartlijstRowResponse,
   GetLogboekResponse,
   GetLogboekRowResponse,
   GetLogboekTotalenResponse,
   StartMethodeTotaalResponse,
   VliegtuigTotaalResponse,
   JaarTotaalResponse,
   GetVliegtuigLogboekResponse,
   GetVliegtuigLogboekRowResponse,
   GetVliegtuigLogboekTotalenResponse,
   GetVliegtuigLogboekTotaalRowResponse,
   VliegtuigMaandTotalenResponse,
   GetVliegDagenResponse,
   GetVliegDagenRowResponse,
   GetRecencyResponse,
)
@UseGuards(AuthGuard(['jwt', 'basic-auth']))
export class StartlijstController extends HeliosController
{
   constructor(private readonly startlijstService: StartlijstService,
               private readonly permissieService: PermissieService)
   {
      super();
   }

   @Get('GetObject')
   @ApiOperation({summary: 'Ophalen van een enkele vlucht.'})
   @ApiResponse({status: HttpStatus.OK, type: StartlijstObjectResponse})
   async GetObject(
      @CurrentUser() user: RefLid,
      @Query() queryParams: GetObjectRequest,
   ): Promise<StartlijstObjectResponse>
   {
      this.permissieService.heeftToegang(user, 'Startlijst.GetObject');
      return await this.startlijstService.GetObject(user, queryParams.ID);
   }

   @Get('GetObjects')
   @ApiOperation({summary: 'Ophalen van startlijst records.'})
   @ApiResponse({status: HttpStatus.OK, type: GetObjectsStartlijstResponse})
   async GetObjects(
      @CurrentUser() user: RefLid,
      @Query() queryParams: GetObjectsStartlijstRequest,
   ): Promise<GetObjectsStartlijstResponse>
   {
      this.permissieService.heeftToegang(user, 'Startlijst.GetObjects');
      return await this.startlijstService.GetObjects(user, queryParams);
   }

   @Get('GetLogboek')
   @ApiOperation({summary: 'Ophalen van het lid-logboek.'})
   @ApiResponse({status: HttpStatus.OK, type: GetLogboekResponse})
   async GetLogboek(
      @CurrentUser() user: RefLid,
      @Query() queryParams: GetLogboekRequest,
   ): Promise<GetLogboekResponse>
   {
      this.permissieService.heeftToegang(user, 'Startlijst.GetLogboek');
      return await this.startlijstService.GetLogboek(user, queryParams);
   }

   @Get('GetLogboekTotalen')
   @ApiOperation({summary: 'Ophalen van logboek totalen voor een lid.'})
   @ApiResponse({status: HttpStatus.OK, type: GetLogboekTotalenResponse})
   async GetLogboekTotalen(
      @CurrentUser() user: RefLid,
      @Query() queryParams: GetLogboekTotalenRequest,
   ): Promise<GetLogboekTotalenResponse>
   {
      this.permissieService.heeftToegang(user, 'Startlijst.GetLogboekTotalen');
      return await this.startlijstService.GetLogboekTotalen(user, queryParams);
   }

   @Get('GetVliegtuigLogboek')
   @ApiOperation({summary: 'Ophalen van het logboek per vliegtuig.'})
   @ApiResponse({status: HttpStatus.OK, type: GetVliegtuigLogboekResponse})
   async GetVliegtuigLogboek(
      @CurrentUser() user: RefLid,
      @Query() queryParams: GetVliegtuigLogboekRequest,
   ): Promise<GetVliegtuigLogboekResponse>
   {
      this.permissieService.heeftToegang(user, 'Startlijst.GetVliegtuigLogboek');
      return await this.startlijstService.GetVliegtuigLogboek(user, queryParams);
   }

   @Get('GetVliegtuigLogboekTotalen')
   @ApiOperation({summary: 'Ophalen van vliegtuig-logboek totalen per maand.'})
   @ApiResponse({status: HttpStatus.OK, type: GetVliegtuigLogboekTotalenResponse})
   async GetVliegtuigLogboekTotalen(
      @CurrentUser() user: RefLid,
      @Query() queryParams: GetVliegtuigLogboekTotalenRequest,
   ): Promise<GetVliegtuigLogboekTotalenResponse>
   {
      this.permissieService.heeftToegang(user, 'Startlijst.GetVliegtuigLogboekTotalen');
      return await this.startlijstService.GetVliegtuigLogboekTotalen(user, queryParams);
   }

   @Get('GetVliegDagen')
   @ApiOperation({summary: 'Ophalen van dagen waarop starts aanwezig zijn.'})
   @ApiResponse({status: HttpStatus.OK, type: GetVliegDagenResponse})
   async GetVliegDagen(
      @CurrentUser() user: RefLid,
      @Query() queryParams: GetVliegDagenRequest,
   ): Promise<GetVliegDagenResponse>
   {
      this.permissieService.heeftToegang(user, 'Startlijst.GetVliegDagen');
      return await this.startlijstService.GetVliegDagen(user, queryParams);
   }

   @Get('GetRecency')
   @ApiOperation({summary: 'Ophalen van recency en barometer status voor een vlieger.'})
   @ApiResponse({status: HttpStatus.OK, type: GetRecencyResponse})
   async GetRecency(
      @CurrentUser() user: RefLid,
      @Query() queryParams: GetRecencyRequest,
   ): Promise<GetRecencyResponse>
   {
      this.permissieService.heeftToegang(user, 'Startlijst.GetRecency');
      return await this.startlijstService.GetRecency(user, queryParams.VLIEGER_ID, queryParams.DATUM);
   }
}