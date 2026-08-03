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
