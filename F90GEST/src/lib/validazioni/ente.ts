import { z } from "zod";

// Codice fiscale di un ente: 11 cifre numeriche (come la P.IVA) nella
// grande maggioranza dei casi. La validazione algoritmica completa del
// codice fiscale delle persone fisiche (checksum, coerenza con nascita) è
// prevista dalla milestone M2 per l'anagrafica soci — qui basta la forma.
const regexCodiceFiscaleEnte = /^\d{11}$/;
const regexPartitaIva = /^\d{11}$/;

export const schemaEnte = z.object({
  denominazione: z.string().min(1, "Inserire la denominazione dell'associazione."),
  codiceFiscale: z
    .string()
    .regex(regexCodiceFiscaleEnte, "Il codice fiscale dell'ente deve essere di 11 cifre numeriche."),
  partitaIva: z
    .string()
    .regex(regexPartitaIva, "La partita IVA deve essere di 11 cifre numeriche.")
    .optional()
    .or(z.literal("")),
  sedeLegaleVia: z.string().min(1, "Inserire l'indirizzo della sede legale."),
  sedeLegaleCap: z.string().regex(/^\d{5}$/, "Il CAP deve essere di 5 cifre."),
  sedeLegaleComune: z.string().min(1, "Inserire il comune della sede legale."),
  sedeLegaleProvincia: z
    .string()
    .length(2, "La provincia va indicata con la sigla di 2 lettere (es. BR).")
    .toUpperCase(),
  sedeOperativaVia: z.string().optional().or(z.literal("")),
  sedeOperativaCap: z.string().regex(/^\d{5}$/).optional().or(z.literal("")),
  sedeOperativaComune: z.string().optional().or(z.literal("")),
  sedeOperativaProvincia: z.string().length(2).toUpperCase().optional().or(z.literal("")),
  pec: z.string().email("PEC non valida.").optional().or(z.literal("")),
  email: z.string().email("Email non valida.").optional().or(z.literal("")),
  telefono: z.string().optional().or(z.literal("")),
  iban: z.string().optional().or(z.literal("")),
  dataCostituzione: z.string().optional().or(z.literal("")),
  statutoRiferimento: z.string().optional().or(z.literal("")),
  iscrittoRunts: z.boolean(),
  numeroRunts: z.string().optional().or(z.literal("")),
  regimeFiscale: z.string().optional().or(z.literal("")),
  piePaginaRicevute: z.string().optional().or(z.literal("")),
});

export type DatiEnte = z.infer<typeof schemaEnte>;
