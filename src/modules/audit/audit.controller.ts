import {
    Controller,
    HttpException,
    HttpStatus,
    Logger,
    Query
} from '@nestjs/common';
import {IHeliosGetObjectsResponse} from "../../core/DTO/IHeliosGetObjectsResponse";
import {GetObjectRequest} from "../../core/DTO/IHeliosFilter";
import {
    HeliosController,
    HeliosGetObject,
    HeliosGetObjects
} from "../../core/controllers/helios/helios.controller";
import {AuditService} from "./audit.service";
import {AuditDto} from "../../generated/nestjs-dto/audit.dto";
import {GetObjectsAuditRequest} from "./GetObjectsAuditRequest";
import {OnEvent} from "@nestjs/event-emitter";
import {DatabaseEvents} from "../../core/helpers/Events";
import {ConfigService} from "@nestjs/config";
import {ApiTags} from "@nestjs/swagger";
import {GetObjectsAuditResponse} from "./GetObjectsAuditResponse";
import {PermissieService} from "../authorisatie/permissie.service";
import {CurrentUser} from "../login/current-user.decorator";
import {Prisma, RefLid} from "@prisma/client";
import {safeStringify} from "../../core/helpers/LogHelper";

@Controller('Audit')
@ApiTags('Audit')
export class AuditController extends HeliosController {
    private readonly logger = new Logger(AuditController.name);
    excludeClasses = ['ABCD'];

    constructor(private readonly auditService: AuditService,
                private readonly configService: ConfigService,
                private readonly permissieService: PermissieService) {
        super()

        // excludeClasses is een lijst van classes die niet ge-audit mogen worden
        const excludeAudit: string[] = this.configService.getOrThrow<string[]>('LOGGING.EXCLUDE_AUDIT');
        if (excludeAudit) {
            this.excludeClasses = this.excludeClasses.concat(excludeAudit)
        }
    }


    @HeliosGetObject(AuditDto)
    async GetObject(
        @CurrentUser() currentUser: RefLid,
        @Query() queryParams: GetObjectRequest): Promise<AuditDto> {
        this.logger.verbose(`AuditController.GetObject(${safeStringify({currentUser, queryParams})})`);
        this.permissieService.heeftToegang(currentUser, 'Audit.GetObject');

        const obj = await this.auditService.GetObject(queryParams.ID);

        // record moet van de user zijn of de gebruiker moet beheerder zijn
        if (!this.permissieService.isBeheerder(currentUser) && obj.LID_ID !== currentUser.ID) {
            throw new HttpException(`Geen eigenaar`, HttpStatus.UNAUTHORIZED);
        }
        return obj;
    }

    // haal objects op uit de database op basis van de query parameters
    @HeliosGetObjects(GetObjectsAuditResponse)
    async GetObjects(
        @CurrentUser() currentUser: RefLid,
        @Query() queryParams: GetObjectsAuditRequest): Promise<IHeliosGetObjectsResponse<GetObjectsAuditResponse>> {
        this.logger.verbose(`AuditController.GetObjects(${safeStringify({currentUser, queryParams})})`);
        this.permissieService.heeftToegang(currentUser, 'Audit.GetObjects');
        // als de gebruiker geen beheerder is, dan mag hij alleen zijn eigen records zien
        if (!this.permissieService.isBeheerder(currentUser)) {
            queryParams.LID_ID = currentUser.ID;
        }
        return await this.auditService.GetObjects(queryParams);
    }

    // luister naar events van de database acties
    // sla data op in de audit tabel wanneer een record wordt toegevoegd
    @OnEvent(DatabaseEvents.Created)
    CreatedRecord(objNaam: string, id: number, data: unknown, result: unknown, actorId: number) {
        this.logger.verbose(`AuditController.CreatedRecord(${safeStringify({objNaam, id, data, result, actorId})})`);
        // Niet alles mag in de audit trail
        if (this.excludeClasses.includes(objNaam))
            return;

        const record: Prisma.AuditCreateInput = {
            DATUM: new Date(),
            RefLid: {
                connect: {
                    ID: actorId
                }
            },
            OBJECT_ID: id,
            TABEL_NAAM: objNaam,
            DATA: JSON.stringify(data),
            RESULTAAT: JSON.stringify(result),
            ACTIE: 'Toevoegen'
        }
        // AddObject() wordt hier bewust niet awaited (event listener), maar een verworpen promise die niet wordt
        // afgehandeld crasht de hele Node applicatie. Falende audit logging mag nooit de eigenlijke actie blokkeren.
        this.auditService.AddObject(record).catch(err => this.logger.error(`Audit log mislukt voor ${objNaam}.Created (ID=${id}): ${err}`));
    }


    //----------------------------------------------------------------------------------------------------------------------------------//
    // luister naar events van de database acties
    // sla data op in de audit tabel wanneer een record wordt aangepast
    @OnEvent(DatabaseEvents.Updated)
    UpdatedRecord(objNaam: string, id: number, before: unknown, data: unknown, result: unknown, actorId: number) {
        this.logger.verbose(`AuditController.UpdatedRecord(${safeStringify({objNaam, id, before, data, result, actorId})})`);
        // Niet alles mag in de audit trail
        if (this.excludeClasses.includes(objNaam))
            return;

        const record: Prisma.AuditCreateInput = {
            DATUM: new Date(),
            RefLid: {
                connect: {
                    ID: actorId
                }
            },
            OBJECT_ID: id,
            TABEL_NAAM: objNaam,
            VOOR: JSON.stringify(before),
            DATA: JSON.stringify(data),
            RESULTAAT: JSON.stringify(result),
            ACTIE: 'Aanpassen'
        }
        this.auditService.AddObject(record).catch(err => this.logger.error(`Audit log mislukt voor ${objNaam}.Updated (ID=${id}): ${err}`));
    }


    // luister naar events van de database acties
    // sla data op in de audit tabel wanneer een record wordt verwijderd
    @OnEvent(DatabaseEvents.Removed)
    RemovedRecord(objNaam: string, id: number, data: unknown, actorId: number) {
        this.logger.verbose(`AuditController.RemovedRecord(${safeStringify({objNaam, id, data, actorId})})`);
        // Niet alles mag in de audit trail
        if (this.excludeClasses.includes(objNaam))
            return;

        const record: Prisma.AuditCreateInput = {
            DATUM: new Date(),
            RefLid: {connect: {ID: actorId}},
            TABEL_NAAM: objNaam,
            OBJECT_ID: id,
            VOOR: JSON.stringify(data),
            ACTIE: 'Verwijderd'
        }
        this.auditService.AddObject(record).catch(err => this.logger.error(`Audit log mislukt voor ${objNaam}.Removed (ID=${id}): ${err}`));
    }

    //------------- Specifieke endpoints staan hieronder --------------------//


}
