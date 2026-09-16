// bouwt de "registratie (callsign)" weergave van een vliegtuig, zoals REG_CALL in de PHP database views
// (CONCAT(IFNULL(REGISTRATIE,''),' (',IFNULL(CALLSIGN,''),')')) - maar zonder de lege haakjes als er geen
// callsign is
export function RegCall(registratie: string | null | undefined, callsign: string | null | undefined): string
{
   const reg = registratie ?? '';
   return callsign ? `${reg} (${callsign})` : reg;
}
