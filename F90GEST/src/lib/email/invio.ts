import "server-only";
import nodemailer from "nodemailer";

export type EsitoInvioEmail = { ok: true } | { ok: false; errore: string };

/**
 * Configurazione SMTP letta da variabili d'ambiente (mai da Parametro, a
 * differenza delle impostazioni di business §3.4/§12): sono credenziali, non
 * regole configurabili dall'interfaccia. Lasciare SMTP_HOST vuoto disabilita
 * l'invio (utile in sviluppo/test) senza far fallire la build.
 */
function creaTransporter() {
  const host = process.env.SMTP_HOST;
  if (!host) return null;
  const porta = Number(process.env.SMTP_PORT ?? "587");
  return nodemailer.createTransport({
    host,
    port: porta,
    secure: porta === 465,
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD } : undefined,
  });
}

export async function inviaEmail(dati: { to: string; subject: string; html: string }): Promise<EsitoInvioEmail> {
  const transporter = creaTransporter();
  if (!transporter) {
    return { ok: false, errore: "Server SMTP non configurato (variabile d'ambiente SMTP_HOST mancante)." };
  }
  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || "no-reply@example.org",
      to: dati.to,
      subject: dati.subject,
      html: dati.html,
    });
    return { ok: true };
  } catch (errore) {
    return { ok: false, errore: errore instanceof Error ? errore.message : "Errore di invio sconosciuto." };
  }
}
