// Alle instellingen komen uit de omgeving (.env, zie .env-template). De vorm van het object is gelijk aan het
// vroegere helios-config.json, zodat configService.get('JWT.JWT_ACCESS_TOKEN_SECRET') e.d. ongewijzigd blijven werken.
// Geheimen (JWT) hebben bewust geen default in de code

interface HeliosConfig {
    LOGGING: {
        SQL: boolean,                  // SQL queries van Prisma loggen
        EXCLUDE_AUDIT: string[],       // service namen die niet in de audit trail komen
    },
    JWT: {
        JWT_ACCESS_TOKEN_SECRET: string,
        JWT_ACCESS_TOKEN_EXPIRATION_MS: string,
        JWT_REFRESH_TOKEN_SECRET: string,
        JWT_REFRESH_TOKEN_EXPIRATION_MS: string,
    },
    app_settings: {
        DocDir: string,
        AvatarDir: string,
    },
    ddwv: {
        START: string,                 // begin DDWV seizoen, "MM-DD"
        EIND: string,                  // einde DDWV seizoen, "MM-DD"
    },
}

export default (): HeliosConfig => {
    const env = process.env;

    const config: HeliosConfig = {
        LOGGING: {
            SQL: alsBoolean(env.LOGGING_SQL, false),
            EXCLUDE_AUDIT: alsLijst(env.LOGGING_EXCLUDE_AUDIT),
        },
        JWT: {
            JWT_ACCESS_TOKEN_SECRET: verplicht('JWT_ACCESS_TOKEN_SECRET'),
            JWT_ACCESS_TOKEN_EXPIRATION_MS: tekst(env.JWT_ACCESS_TOKEN_EXPIRATION_MS) ?? '3600000',          // 1 uur
            JWT_REFRESH_TOKEN_SECRET: verplicht('JWT_REFRESH_TOKEN_SECRET'),
            JWT_REFRESH_TOKEN_EXPIRATION_MS: tekst(env.JWT_REFRESH_TOKEN_EXPIRATION_MS) ?? '604800000',      // 7 dagen
        },
        app_settings: {
            DocDir: tekst(env.DOC_DIR) ?? '/var/www/html/documenten',
            AvatarDir: tekst(env.AVATAR_DIR) ?? '/var/www/html/avatars',
        },
        ddwv: {
            START: tekst(env.DDWV_START) ?? '04-01',
            EIND: tekst(env.DDWV_EIND) ?? '10-31',
        },
    };
    return config;
};

// lege of alleen-spaties waarde telt als niet gezet
function tekst(waarde: string | undefined): string | undefined {
    const getrimd = waarde?.trim();
    return getrimd ? getrimd : undefined;
}

// zonder deze waarde kan Helios.js niet draaien: liever bij het opstarten stoppen dan pas bij het eerste inloggen
function verplicht(naam: string): string {
    const waarde = tekst(process.env[naam]);
    if (!waarde)
        throw new Error(`${naam} ontbreekt in de omgeving (.env), zie .env-template`);
    return waarde;
}

function alsBoolean(waarde: string | undefined, standaard: boolean): boolean {
    const w = tekst(waarde)?.toLowerCase();
    if (w === undefined)
        return standaard;
    return w === 'true' || w === '1' || w === 'ja';
}

// komma gescheiden lijst, bv. "AuditService, LoginService"
function alsLijst(waarde: string | undefined): string[] {
    return (tekst(waarde) ?? '').split(',').map((w) => w.trim()).filter((w) => w.length > 0);
}
