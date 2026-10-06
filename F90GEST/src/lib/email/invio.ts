import "server-only";
import nodemailer from "nodemailer";
import { prisma } from "@/lib/prisma";
import { creaTransporterPerCasella } from "@/lib/casella-email/connessione";

export type EsitoInvioEmail = { ok: true } | { ok: false; errore: string };

/**
 * Configurazione SMTP: preferisce una casella "ordinaria" attiva
 * configurata da Amministrazione → Email e PEC (introdotta in una
 * milestone fuori piano successiva a M9); se nessuna è presente, ricade
 * sulle variabili d'ambiente SMTP_* già previste da M9, per non rompere le
 * installazioni esistenti che configurano l'invio solo via .env. Lasciare
 * entrambe non configurate disabilita l'invio (utile in sviluppo/test)
 * senza far fallire la build.
 */
async function creaTransporter(): Promise<{ transporter: ReturnType<typeof nodemailer.createTransport>; from: string } | null> {
  const casella = await prisma.casellaEmail.findFirst({ where: { tipo: "ordinaria", attiva: true, deletedAt: null } });
  if (casella) {
    return { transporter: creaTransporterPerCasella(casella), from: casella.indirizzoEmail };
  }

  const host = process.env.SMTP_HOST;
  if (!host) return null;
  const porta = Number(process.env.SMTP_PORT ?? "587");
  const transporter = nodemailer.createTransport({
    host,
    port: porta,
    secure: porta === 465,
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD } : undefined,
  });
  return { transporter, from: process.env.SMTP_FROM || "no-reply@example.org" };
}

export async function inviaEmail(dati: { to: string; subject: string; html: string }): Promise<EsitoInvioEmail> {
  const configurazione = await creaTransporter();
  if (!configurazione) {
    return {
      ok: false,
      errore: "Nessun server per l'invio configurato (né una casella email attiva né la variabile SMTP_HOST).",
    };
  }
  try {
    await configurazione.transporter.sendMail({
      from: configurazione.from,
      to: dati.to,
      subject: dati.subject,
      html: dati.html,
    });
    return { ok: true };
  } catch (errore) {
    return { ok: false, errore: errore instanceof Error ? errore.message : "Errore di invio sconosciuto." };
  }
}
