
import * as fs from 'fs';
import { join } from 'path';
import {Logger} from "@nestjs/common";

const JSON_CONFIG_FILENAME = 'helios-config.json';

interface HeliosConfig {
    db_info: {
        dbType: string,
        dbHost: string,
        dbName: string,
        dbUser: string,
        dbPassword: string,
    },
    smtp_settings: {
        smtpuser: string,
        smtppass: string,
        smtphost: string,
        smtpsecure: string,
        smtpport: number
        from: string,
        name: string,
    },
    app_settings: {
        DbLogging: boolean,
        DbError: boolean,
        Debug: boolean,
        DocDir: string,
        LogDir: string,
        Vereniging: string,
        EmailVeiligheidsManager: string,
        DemoMode: boolean,
        ApiKeySMS: string,
        KeyJWT: string,
        twoFactor: boolean,
        bypassToken: string,
        PaxBevoegdheid: number,
    },
    eBoekhouden_settings: {
        SoapBaseUrl: string,
        Username: string,
        SecurityCode1: string,
        SecurityCode2: string,
        Betalingstermijn: number,
        Factuursjabloon: string,
        PerEmailVerzenden: boolean,
        EmailOnderwerp: string,
        EmailBericht: string,
        EmailVanNaam: string,
        EmailVanAdres: string
        AutomatischeIncasso: boolean,
        BoekhoudmutatieOmschrijving: string,
        IncassoMachtigingFirst: boolean,
        InBoekhoudingPlaatsen: boolean,
        TegenrekeningCode: number,
        KostenplaatsID: number
    },
    iDeal: {
        mollieKey: string,
        returnUrl: string,
        reportUrl:  string,
    },
    ddwv: {
        DDWV: boolean,
        VELD_ID: number,
        START: string,
        EIND: string
        MAX_STRIPPEN: number,
        STRIPPEN_RETOUR: number,
        STRIPPEN_RETOUR_OP_VLIEGDAG: number,
        ANNULEREN_VLIEGDAG: number,
        CREW_VERGOEDING: number,
    }
}

export default () => {
    const heliosConfig: HeliosConfig = {
        db_info: {
            dbType: 'mysql',
            dbHost: 'mariadb',
            dbName: 'helios',
            dbUser: 'root',
            dbPassword: 'rootroot'
        },
        smtp_settings: {
            smtpuser: 'noreply@gezc.org',
            smtppass: 'XTw!KrPypaR4z-U9-M',
            smtphost: 'smtp.gmail.com',
            smtpsecure: 'tls',
            smtpport: 587,
            from: 'ict@gezc.org',
            name: 'Uw systeem beheerder'
        },
        app_settings: {
            DbLogging: true,
            DbError: true,
            Debug: true,
            DocDir: '/var/www/html/documenten',
            LogDir: '/var/www/html/log/',
            Vereniging: 'GeZC',
            EmailVeiligheidsManager: 'veiligheidsmanager@gezc.org',
            DemoMode: true,
            ApiKeySMS: 'API key here',
            KeyJWT: '480f4p*%ghouiEWf*DXKz22Vy7RDzFeaBlw329zMyHh*o',
            twoFactor: false,
            bypassToken: new Date().getDay().toString() + 'BDd2ft2xxYPmqPTm@C_vGPy-mot7GCCmpU9nvfDx',
            PaxBevoegdheid: 271
        },
        eBoekhouden_settings: {
            SoapBaseUrl: 'https://soap.e-boekhouden.nl/soap.asmx?WSDL',
            Username: 'penningmeester@gezc.org',
            SecurityCode1: 'f14ecb4cd6f86cebcc4602eba5f4559a',
            SecurityCode2: 'FC40D35A-D9C7-4B4E-B164-6B834B36F61A',
            Betalingstermijn: 14,
            Factuursjabloon: 'Factuur Lidmaatschap',
            PerEmailVerzenden: false,
            EmailOnderwerp: 'factuur testje',
            EmailBericht: 'Nou dat is weer een factuur van de GeZC',
            EmailVanNaam: 'penningmeester',
            EmailVanAdres: 'ict@gezc.org',
            AutomatischeIncasso: false,
            BoekhoudmutatieOmschrijving: 'lidmaatschap ',
            IncassoMachtigingFirst: false,
            InBoekhoudingPlaatsen: false,
            TegenrekeningCode: 1800,
            KostenplaatsID: 0
        },
        iDeal: {
            mollieKey: 'test_Nb3HMmyT2mdPhMQk7qRj8ASArRvKjp',
            returnUrl: 'https://mijn.gezc.org/profiel',
            reportUrl: `https://mijn.gezc.org/api/ideal/report`
        },
        ddwv: {
            DDWV: true,
            VELD_ID: 901,
            START: '04-01',
            EIND: '10-31',
            MAX_STRIPPEN: 100,
            STRIPPEN_RETOUR: 2004,
            STRIPPEN_RETOUR_OP_VLIEGDAG: 2005,
            ANNULEREN_VLIEGDAG: 2006,
            CREW_VERGOEDING: 2007,
        }
    };

    const configFile = join(process.cwd(), '/', JSON_CONFIG_FILENAME)
    const logger = new Logger()
    try
    {
        return JSON.parse(fs.readFileSync(configFile, 'utf8')) as HeliosConfig
    }
    catch (e) {
        logger.error(`Failed to load configuration from ${configFile}: ${e.message}`);
    }
    return heliosConfig;
};