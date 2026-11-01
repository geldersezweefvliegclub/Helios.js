import {Settings} from 'luxon';

// Tijdzone voor alle tijd functies van de applicatie (optioneel, default Europe/Amsterdam).
// Wordt gezet als process.env.TZ, zodat ook de lokale tijd functies van Date (getHours(), getDate(), ...) deze
// tijdzone gebruiken, ongeacht de tijdzone van de server/container, en als default zone van luxon.
// Moet als eerste geïmporteerd worden in main.ts, voordat er een Date wordt aangemaakt.
export const TIMEZONE = process.env.TIMEZONE || 'Europe/Amsterdam';

process.env.TZ = TIMEZONE;
Settings.defaultZone = TIMEZONE;
