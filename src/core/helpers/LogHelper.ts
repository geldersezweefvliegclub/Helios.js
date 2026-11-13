import {ArgumentsHost, Logger} from "@nestjs/common";
import {Request} from "express";

// Keys die nooit naar de logs geschreven mogen worden (plaintext/gehashte wachtwoorden, tokens).
const SENSITIVE_KEYS = ['WACHTWOORD', 'Wachtwoord', 'wachtwoord', 'AccessToken', 'REFRESH_TOKEN', 'RefreshToken', 'refreshToken'];

// JSON.stringify wrapper voor debug logging die gevoelige velden (wachtwoorden, tokens) maskeert.
export function safeStringify(value: unknown): string {
    return JSON.stringify(value, (key, val) => SENSITIVE_KEYS.includes(key) ? '***' : val);
}

// Gedeeld door elke exception filter: logt een warning wanneer een API request niet succesvol afgehandeld kon worden.
export function logFailedRequest(logger: Logger, host: ArgumentsHost, status: number, message: string): void {
    const request = host.switchToHttp().getRequest<Request>();
    logger.warn(`${request.method} ${request.originalUrl} => ${status} ${message}`);
}

// Maakt een filter voor IGNORE_LOGGING: een komma gescheiden lijst van "Class.method" of "Class" entries.
// Onze logging conventie logt altijd "Class.method(args)" bij binnenkomst en "Class.method() => result" bij het
// verlaten. Een entry met punt matcht een functie ("Class.method("), zonder punt elke functie van de class ("Class.").
// Een * staat voor een willekeurig stuk van de class- of functienaam:
//   *.GetObjects       - GetObjects van elke class
//   Leden*             - elke functie van LedenService, LedenController, ...
//   *Service.Get*      - elke Get... functie van elke service
// Geeft true terug als de logregel weggelaten moet worden
export function maakLogFilter(ignoreLogging: string | undefined): (bericht: string) => boolean {
    const patronen = (ignoreLogging ?? '')
        .split(',')
        .map((entry) => entry.trim())
        .filter(Boolean)
        .map((entry) => {
            const naam = entry.split('*').map((deel) => deel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('\\w*');
            return new RegExp(`^${naam}${entry.includes('.') ? '\\(' : '\\.'}`);
        });

    return (bericht: string) => patronen.some((patroon) => patroon.test(bericht));
}
