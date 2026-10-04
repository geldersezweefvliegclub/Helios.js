// Helpers voor kolommen die in Prisma als DateTime zijn gemodelleerd, maar met een @db.Date of @db.Time
// database-annotatie enkel een kalenderdatum, resp. enkel een tijdstip representeren. Prisma/JS kennen geen apart
// "datum-zonder-tijd" of "tijd-zonder-datum" type - dit blijft altijd een JS Date object, dat bij serialisatie naar
// JSON altijd een volledige ISO-8601 string met tijdsdeel (resp. datumdeel) oplevert. Deze helpers zorgen dat de
// API enkel het relevante deel teruggeeft, en dat een ongewijzigd terugewijzigd record bij een update weer een geldig
// Date object wordt in plaats van een kale string die Prisma's eigen validatie afwijst.

// formatteert een @db.Date kolom (enkel een kalenderdatum, geen tijd) als "yyyy-MM-dd" string voor de response,
// in plaats van een volledige ISO-8601 datetime met een zinloos "T00:00:00.000Z" tijdsdeel
export function toDateOnly(value: Date | null | undefined): string | null | undefined
{
   if (value === undefined) return undefined;
   if (value === null) return null;
   return value.toISOString().slice(0, 10);
}

// formatteert een @db.Time kolom (enkel een tijdstip, Prisma gebruikt hiervoor intern een dummy datum 1970-01-01)
// als "HH:mm:ss" string voor de response, in plaats van een volledige ISO-8601 datetime met een zinloze datum
export function toTimeOnly(value: Date | null | undefined): string | null | undefined
{
   if (value === undefined) return undefined;
   if (value === null) return null;
   return value.toISOString().slice(11, 19);
}

// formatteert een @db.Time kolom als "HH:mm" string, zonder seconden - zoals de PHP startlijst dat teruggeeft
// (time_format('%H:%i') in de startlijst_view en substr(.., 0, 5) in RecordToOutput())
export function toTimeHHmm(value: Date | null | undefined): string | null | undefined
{
   if (value === undefined) return undefined;
   if (value === null) return null;
   return value.toISOString().slice(11, 16);
}

// zet een binnenkomende waarde voor een @db.Date kolom om naar een echt Date object. Nodig omdat een client een
// eerder opgehaald record (met "yyyy-MM-dd" string, zie toDateOnly) vaak ongewijzigd terugstuurt bij een update -
// Prisma accepteert voor een DateTime kolom geen kale datum-string, enkel een volledige ISO-8601 tijdstip of Date object.
// Het resultaat is altijd UTC middernacht, zodat tijdzone en tijdsdeel geen invloed hebben: van een string wordt de
// kalenderdatum genomen zoals de client die schrijft ("2026-09-28T00:00:00+02:00" => 2026-09-28), van een Date object
// de UTC kalenderdatum
export function parseDateOnly(value: Date | string | null | undefined): Date | null | undefined
{
   if (value === undefined) return undefined;
   if (value === null) return null;
   if (typeof value === "string")
   {
      const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value.trim());
      if (match)
         return new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
      value = new Date(value);
   }
   if (isNaN(value.getTime())) return value;
   return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));
}

// zet een binnenkomende waarde voor een @db.Time kolom om naar een echt Date object (met de dummy datum 1970-01-01).
// Accepteert zowel een kale tijd-string ("13:51:00", zie toTimeOnly) als een volledige ISO-8601 string
export function parseTimeOnly(value: Date | string | null | undefined): Date | null | undefined
{
   if (value === undefined) return undefined;
   if (value === null) return null;
   if (value instanceof Date) return value;
   return new Date(value.includes("T") ? value : `1970-01-01T${value}`);
}

// formatteert een aantal seconden als "HH:mm" tijdsduur
export function SecondenNaarTijd(seconden: number): string
{
   const uren = Math.floor(seconden / 3600);
   const minuten = Math.floor((seconden % 3600) / 60);
   return `${String(uren).padStart(2, '0')}:${String(minuten).padStart(2, '0')}`;
}

// formatteert een aantal minuten als "HH:mm" tijdsduur
export function MinutenNaarTijd(minuten: number): string
{
   const uren = Math.floor(minuten / 60);
   const resterendeMinuten = Math.floor(minuten % 60);
   return `${String(uren).padStart(2, '0')}:${String(resterendeMinuten).padStart(2, '0')}`;
}

// normaliseert een tijdstip naar de kalenderdatum ervan (UTC-middernacht), zodat deze vergeleken kan worden
// met een @db.Date kolom
export function DatumZonderTijd(tijdstip: Date): Date
{
   return new Date(Date.UTC(tijdstip.getFullYear(), tijdstip.getMonth(), tijdstip.getDate()));
}
