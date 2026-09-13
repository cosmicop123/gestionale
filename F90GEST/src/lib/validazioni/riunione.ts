import { z } from "zod";

export const TIPI_RIUNIONE = ["assemblea", "direttivo"] as const;
export const ETICHETTE_TIPI_RIUNIONE: Record<(typeof TIPI_RIUNIONE)[number], string> = {
  assemblea: "Assemblea",
  direttivo: "Consiglio direttivo",
};

export const schemaRiunione = z.object({
  tipo: z.enum(TIPI_RIUNIONE, { message: "Selezionare il tipo di riunione." }),
  data: z.string().min(1, "Inserire la data."),
  ora: z.string().optional().or(z.literal("")),
  sede: z.string().optional().or(z.literal("")),
  ordineDelGiorno: z.string().min(1, "Inserire l'ordine del giorno."),
});
export type DatiRiunione = z.infer<typeof schemaRiunione>;

export const schemaQuorum = z.object({
  quorumCostitutivoVerificato: z.boolean().optional(),
  quorumDeliberativoVerificato: z.boolean().optional(),
});
export type DatiQuorum = z.infer<typeof schemaQuorum>;

export const schemaVerbale = z.object({
  verbaleTesto: z.string().min(1, "Inserire il testo del verbale."),
});
export type DatiVerbale = z.infer<typeof schemaVerbale>;

export const schemaPartecipanteRiunione = z.object({
  personaId: z.string().min(1, "Selezionare una persona."),
  convocato: z.boolean(),
  delegatoDaId: z.string().optional().or(z.literal("")),
});
export type DatiPartecipanteRiunione = z.infer<typeof schemaPartecipanteRiunione>;

export const ESITI_DELIBERA = ["approvata", "respinta", "rinviata"] as const;
export const ETICHETTE_ESITI_DELIBERA: Record<(typeof ESITI_DELIBERA)[number], string> = {
  approvata: "Approvata",
  respinta: "Respinta",
  rinviata: "Rinviata",
};

export const schemaDelibera = z.object({
  oggetto: z.string().min(1, "Inserire l'oggetto della delibera."),
  esito: z.enum(ESITI_DELIBERA, { message: "Selezionare l'esito." }),
  votiFavorevoli: z.string().optional().or(z.literal("")),
  votiContrari: z.string().optional().or(z.literal("")),
  votiAstenuti: z.string().optional().or(z.literal("")),
});
export type DatiDelibera = z.infer<typeof schemaDelibera>;
