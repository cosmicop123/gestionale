import { z } from "zod";

/** Stesso ordine/elenco del commento su `CaricaSociale` in schema.prisma. */
export const RUOLI_CARICA_SOCIALE = ["Presidente", "Vicepresidente", "Segretario", "Tesoriere", "Consigliere"] as const;

/** Ruoli per cui esiste al più un titolare attivo alla volta: assegnarne un altro chiude automaticamente quello corrente. */
export const RUOLI_CARICA_UNICA = ["Presidente", "Vicepresidente", "Segretario", "Tesoriere"] as const;

export const schemaNominaCaricaSociale = z.object({
  personaId: z.string().min(1, "Selezionare una persona."),
  ruolo: z.enum(RUOLI_CARICA_SOCIALE),
  dataInizioMandato: z.string().min(1, "Inserire la data di inizio mandato."),
  estremiVerbaleNomina: z.string().optional().or(z.literal("")),
});
export type DatiNominaCaricaSociale = z.infer<typeof schemaNominaCaricaSociale>;

export const schemaTerminaMandatoCaricaSociale = z.object({
  dataFineMandato: z.string().min(1, "Inserire la data di fine mandato."),
});
export type DatiTerminaMandatoCaricaSociale = z.infer<typeof schemaTerminaMandatoCaricaSociale>;
