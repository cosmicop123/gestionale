import "server-only";
import nodemailer from "nodemailer";
import { ImapFlow } from "imapflow";
import type { CasellaEmail } from "@prisma/client";
import { decifraSegreto } from "@/lib/email/cifratura";

/**
 * Traduce il livello di sicurezza scelto in UI (nessuna | starttls | tls)
 * nelle opzioni che le due librerie usano davvero. Per IMAP, "nessuna" e
 * "starttls" producono la stessa opzione (`secure: false`): imapflow tenta
 * comunque STARTTLS in automatico se il server lo offre (upgrade
 * opportunistico, mai dannoso); la distinzione in UI resta utile solo come
 * promemoria di cosa il server dell'associazione effettivamente richiede.
 */
function smtpOpzioniSicurezza(sicurezza: string): { secure: boolean; requireTLS: boolean } {
  if (sicurezza === "tls") return { secure: true, requireTLS: false };
  if (sicurezza === "starttls") return { secure: false, requireTLS: true };
  return { secure: false, requireTLS: false };
}

export function creaTransporterPerCasella(casella: CasellaEmail) {
  const { secure, requireTLS } = smtpOpzioniSicurezza(casella.smtpSicurezza);
  return nodemailer.createTransport({
    host: casella.smtpHost,
    port: casella.smtpPorta,
    secure,
    requireTLS,
    auth: { user: casella.smtpUtente, pass: decifraSegreto(casella.smtpPasswordCifrata) },
  });
}

export function creaClientImapPerCasella(casella: CasellaEmail, opzioni?: { verifyOnly?: boolean }): ImapFlow {
  return new ImapFlow({
    host: casella.imapHost,
    port: casella.imapPorta,
    secure: casella.imapSicurezza === "tls",
    auth: { user: casella.imapUtente, pass: decifraSegreto(casella.imapPasswordCifrata) },
    logger: false,
    verifyOnly: opzioni?.verifyOnly ?? false,
  });
}
