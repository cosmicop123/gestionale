import { z } from "zod";

// Ruoli applicativi (§6 della specifica): definiti in un unico punto così
// la UI (select) e la validazione restano sempre coerenti.
export const RUOLI_APPLICATIVI = [
  "amministratore",
  "segreteria",
  "tesoriere",
  "docente",
  "sola_lettura",
] as const;

export const ETICHETTE_RUOLI: Record<(typeof RUOLI_APPLICATIVI)[number], string> = {
  amministratore: "Amministratore",
  segreteria: "Segreteria",
  tesoriere: "Tesoriere",
  docente: "Docente",
  sola_lettura: "Sola lettura",
};

export function etichettaRuolo(ruolo: string): string {
  return (ETICHETTE_RUOLI as Record<string, string>)[ruolo] ?? ruolo;
}

const schemaPassword = z
  .string()
  .min(8, "La password deve contenere almeno 8 caratteri.");

export const schemaNuovoUtente = z.object({
  email: z.string().min(1, "Inserire l'email.").email("Email non valida."),
  ruolo: z.enum(RUOLI_APPLICATIVI, { message: "Selezionare un ruolo." }),
  password: schemaPassword,
});

export type DatiNuovoUtente = z.infer<typeof schemaNuovoUtente>;

export const schemaModificaUtente = z.object({
  ruolo: z.enum(RUOLI_APPLICATIVI, { message: "Selezionare un ruolo." }),
  attivo: z.boolean(),
});

export type DatiModificaUtente = z.infer<typeof schemaModificaUtente>;

export const schemaResetPassword = z.object({
  password: schemaPassword,
});
