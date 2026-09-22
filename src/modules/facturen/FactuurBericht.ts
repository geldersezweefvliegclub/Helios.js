export interface FactuurBericht
{
   FACTUUR_ID: number | null;
   LID_ID: number;
   LIDNR: string | null;
   NAAM: string | null;
   JAAR: number | null;
   DATUM: string;
   OMSCHRIJVING: string | null;
   REGELS: FactuurRegel[];
}

export interface FactuurRegel
{
   // ID van het oper_transacties record waar deze regel uit is opgebouwd - null bij een contributiefactuur
   // (die geen onderliggende transactie heeft)
   TRANSACTIE_ID: number | null;
   CODE: string | null;
   OMSCHRIJVING: string | null;
   AANTAL: number;
   BEDRAG_PER_EENHEID: number;
}


