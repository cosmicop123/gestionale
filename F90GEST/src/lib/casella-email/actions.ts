"use server";
import "server-only";
import { revalidatePath } from "next/cache";
import { simpleParser } from "mailparser";
import { prisma } from "@/lib/prisma";
import { richiediRuolo } from "@/lib/auth/richiedi-utente";
import { registraAudit } from "@/lib/audit";
import { cifraSegreto } from "@/lib/email/cifratura";
import { schemaCasellaEmail, type DatiCasellaEmail } from "@/lib/validazioni/casella-email";
import { creaTransporterPerCasella, creaClientImapPerCasella } from "./connessione";

const SOLO_AMMINISTRATORE = ["amministratore"] as const;

export async function creaCasellaEmail(
  datiGrezzi: DatiCasellaEmail
): Promise<{ errore: string } | { ok: true; casellaId: string }> {
  const utente = await richiediRuolo([...SOLO_AMMINISTRATORE]);
  const risultato = schemaCasellaEmail.safeParse(datiGrezzi);
  if (!risultato.success) return { errore: risultato.error.issues[0].message };
  const dati = risultato.data;
  if (!dati.smtpPassword) return { errore: "Inserire la password SMTP." };
  if (!dati.imapPassword) return { errore: "Inserire la password IMAP." };

  let casellaId: string;
  try {
    const casella = await prisma.casellaEmail.create({
      data: {
        tipo: dati.tipo,
        etichetta: dati.etichetta,
        indirizzoEmail: dati.indirizzoEmail,
        smtpHost: dati.smtpHost,
        smtpPorta: Number(dati.smtpPorta),
        smtpSicurezza: dati.smtpSicurezza,
        smtpUtente: dati.smtpUtente,
        smtpPasswordCifrata: cifraSegreto(dati.smtpPassword),
        imapHost: dati.imapHost,
        imapPorta: Number(dati.imapPorta),
        imapSicurezza: dati.imapSicurezza,
        imapUtente: dati.imapUtente,
        imapPasswordCifrata: cifraSegreto(dati.imapPassword),
        attiva: dati.attiva,
        createdById: utente.id,
      },
    });
    casellaId = casella.id;
  } catch (errore) {
    return { errore: errore instanceof Error ? errore.message : "Errore durante il salvataggio." };
  }

  await registraAudit({ utenteId: utente.id, entita: "CasellaEmail", entitaId: casellaId, azione: "create" });
  revalidatePath("/amministrazione");
  return { ok: true, casellaId };
}

export async function modificaCasellaEmail(
  casellaId: string,
  datiGrezzi: DatiCasellaEmail
): Promise<{ errore: string } | { ok: true }> {
  const utente = await richiediRuolo([...SOLO_AMMINISTRATORE]);
  const risultato = schemaCasellaEmail.safeParse(datiGrezzi);
  if (!risultato.success) return { errore: risultato.error.issues[0].message };
  const dati = risultato.data;

  const esistente = await prisma.casellaEmail.findUnique({ where: { id: casellaId } });
  if (!esistente || esistente.deletedAt) return { errore: "Casella email non trovata." };

  try {
    await prisma.casellaEmail.update({
      where: { id: casellaId },
      data: {
        tipo: dati.tipo,
        etichetta: dati.etichetta,
        indirizzoEmail: dati.indirizzoEmail,
        smtpHost: dati.smtpHost,
        smtpPorta: Number(dati.smtpPorta),
        smtpSicurezza: dati.smtpSicurezza,
        smtpUtente: dati.smtpUtente,
        // Password lasciata vuota in UI = non cambiarla.
        ...(dati.smtpPassword ? { smtpPasswordCifrata: cifraSegreto(dati.smtpPassword) } : {}),
        imapHost: dati.imapHost,
        imapPorta: Number(dati.imapPorta),
        imapSicurezza: dati.imapSicurezza,
        imapUtente: dati.imapUtente,
        ...(dati.imapPassword ? { imapPasswordCifrata: cifraSegreto(dati.imapPassword) } : {}),
        attiva: dati.attiva,
      },
    });
  } catch (errore) {
    return { errore: errore instanceof Error ? errore.message : "Errore durante il salvataggio." };
  }

  await registraAudit({ utenteId: utente.id, entita: "CasellaEmail", entitaId: casellaId, azione: "update" });
  revalidatePath("/amministrazione");
  return { ok: true };
}

export async function eliminaCasellaEmail(casellaId: string): Promise<{ errore: string } | { ok: true }> {
  const utente = await richiediRuolo([...SOLO_AMMINISTRATORE]);
  const esistente = await prisma.casellaEmail.findUnique({ where: { id: casellaId } });
  if (!esistente || esistente.deletedAt) return { errore: "Casella email non trovata." };

  await prisma.casellaEmail.update({ where: { id: casellaId }, data: { deletedAt: new Date() } });
  await registraAudit({ utenteId: utente.id, entita: "CasellaEmail", entitaId: casellaId, azione: "delete" });
  revalidatePath("/amministrazione");
  return { ok: true };
}

export type EsitoTestConnessione = {
  smtp: { ok: boolean; errore?: string };
  imap: { ok: boolean; errore?: string };
};

/**
 * Verifica le credenziali senza inviare/leggere nulla: `transporter.verify()`
 * per SMTP, `verifyOnly: true` per IMAP (imapflow autentica e si
 * disconnette da solo). Utile per dare un riscontro immediato in UI prima
 * di fidarsi della configurazione per l'invio reale o la sincronizzazione.
 */
export async function testaConnessioneCasella(casellaId: string): Promise<EsitoTestConnessione | { errore: string }> {
  await richiediRuolo([...SOLO_AMMINISTRATORE]);
  const casella = await prisma.casellaEmail.findUnique({ where: { id: casellaId } });
  if (!casella || casella.deletedAt) return { errore: "Casella email non trovata." };

  const esito: EsitoTestConnessione = { smtp: { ok: false }, imap: { ok: false } };

  try {
    await creaTransporterPerCasella(casella).verify();
    esito.smtp.ok = true;
  } catch (errore) {
    esito.smtp.errore = errore instanceof Error ? errore.message : "Errore di connessione SMTP.";
  }

  const client = creaClientImapPerCasella(casella, { verifyOnly: true });
  try {
    await client.connect();
    esito.imap.ok = true;
  } catch (errore) {
    esito.imap.errore = errore instanceof Error ? errore.message : "Errore di connessione IMAP.";
  }

  return esito;
}

/**
 * Scarica via IMAP i messaggi nuovi dall'ultima sincronizzazione (per UID,
 * mai per data: un UID già visto non viene mai riscaricato). Nessun
 * processo in background in questo stack (§4): la sincronizzazione avviene
 * solo quando un amministratore/segreteria clicca "Sincronizza" in UI.
 */
export async function sincronizzaCasellaEmail(
  casellaId: string
): Promise<{ errore: string } | { ok: true; nuovi: number }> {
  const utente = await richiediRuolo(["amministratore", "segreteria"]);
  const casella = await prisma.casellaEmail.findUnique({ where: { id: casellaId } });
  if (!casella || casella.deletedAt) return { errore: "Casella email non trovata." };

  const client = creaClientImapPerCasella(casella);
  let nuovi = 0;
  try {
    await client.connect();
    const lock = await client.getMailboxLock("INBOX");
    try {
      const ultimoUid = await prisma.messaggioEmailRicevuto.findFirst({
        where: { casellaEmailId: casellaId },
        orderBy: { uidImap: "desc" },
        select: { uidImap: true },
      });
      // Primo UID mai visto: parte da 1 (tutta la casella); altrimenti solo
      // gli UID successivi all'ultimo già scaricato.
      const intervallo = ultimoUid ? `${ultimoUid.uidImap + 1}:*` : "1:*";
      for await (const messaggio of client.fetch(
        intervallo,
        { envelope: true, source: true, uid: true },
        { uid: true }
      )) {
        if (ultimoUid && messaggio.uid <= ultimoUid.uidImap) continue;
        if (!messaggio.source) continue;
        const parsato = await simpleParser(messaggio.source);
        await prisma.messaggioEmailRicevuto.upsert({
          where: { casellaEmailId_uidImap: { casellaEmailId: casellaId, uidImap: messaggio.uid } },
          create: {
            casellaEmailId: casellaId,
            uidImap: messaggio.uid,
            mittente: parsato.from?.text ?? messaggio.envelope?.from?.[0]?.address ?? "mittente ignoto",
            oggetto: parsato.subject ?? messaggio.envelope?.subject ?? "(nessun oggetto)",
            dataMessaggio: parsato.date ?? messaggio.envelope?.date ?? new Date(),
            corpoTesto: parsato.text ?? null,
            corpoHtml: typeof parsato.html === "string" ? parsato.html : null,
          },
          update: {},
        });
        nuovi += 1;
      }
    } finally {
      lock.release();
    }
    await client.logout();
  } catch (errore) {
    try {
      await client.logout();
    } catch {
      // connessione già chiusa/mai apertasi: nulla da fare.
    }
    return { errore: errore instanceof Error ? errore.message : "Errore durante la sincronizzazione IMAP." };
  }

  await prisma.casellaEmail.update({ where: { id: casellaId }, data: { ultimaSincImap: new Date() } });
  await registraAudit({
    utenteId: utente.id,
    entita: "CasellaEmail",
    entitaId: casellaId,
    azione: "sincronizzazione_imap",
    diff: { nuovi },
  });
  revalidatePath("/comunicazioni");
  return { ok: true, nuovi };
}

export async function segnaMessaggioLetto(
  messaggioId: string,
  letto: boolean
): Promise<{ errore: string } | { ok: true }> {
  await richiediRuolo(["amministratore", "segreteria"]);
  await prisma.messaggioEmailRicevuto.update({ where: { id: messaggioId }, data: { letto } });
  revalidatePath("/comunicazioni");
  return { ok: true };
}
