import { z } from "zod";

export const TIPI_CASELLA_EMAIL = ["ordinaria", "pec"] as const;
export const ETICHETTE_TIPI_CASELLA_EMAIL: Record<(typeof TIPI_CASELLA_EMAIL)[number], string> = {
  ordinaria: "Email ordinaria",
  pec: "PEC",
};

export const LIVELLI_SICUREZZA_EMAIL = ["nessuna", "starttls", "tls"] as const;
export const ETICHETTE_SICUREZZA_EMAIL: Record<(typeof LIVELLI_SICUREZZA_EMAIL)[number], string> = {
  nessuna: "Nessuna",
  starttls: "STARTTLS",
  tls: "TLS/SSL",
};

/**
 * Le password sono facoltative in questo schema: in modifica, un campo
 * lasciato vuoto significa "non cambiare la password già salvata" —
 * la decisione se è obbligatorio (creazione) o no (modifica) spetta
 * all'azione server, non allo schema condiviso.
 */
export const schemaCasellaEmail = z.object({
  tipo: z.enum(TIPI_CASELLA_EMAIL),
  etichetta: z.string().min(1, "Inserire un nome per la casella."),
  indirizzoEmail: z.string().email("Indirizzo email non valido."),

  smtpHost: z.string().min(1, "Inserire l'host SMTP."),
  smtpPorta: z
    .string()
    .refine((v) => Number.isInteger(Number(v)) && Number(v) >= 1 && Number(v) <= 65535, "Porta non valida."),
  smtpSicurezza: z.enum(LIVELLI_SICUREZZA_EMAIL),
  smtpUtente: z.string().min(1, "Inserire l'utente SMTP."),
  smtpPassword: z.string().optional().or(z.literal("")),

  imapHost: z.string().min(1, "Inserire l'host IMAP."),
  imapPorta: z
    .string()
    .refine((v) => Number.isInteger(Number(v)) && Number(v) >= 1 && Number(v) <= 65535, "Porta non valida."),
  imapSicurezza: z.enum(LIVELLI_SICUREZZA_EMAIL),
  imapUtente: z.string().min(1, "Inserire l'utente IMAP."),
  imapPassword: z.string().optional().or(z.literal("")),

  attiva: z.boolean(),
});
export type DatiCasellaEmail = z.infer<typeof schemaCasellaEmail>;
