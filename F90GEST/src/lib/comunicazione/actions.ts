"use server";
import "server-only";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { richiediRuolo } from "@/lib/auth/richiedi-utente";
import { registraAudit } from "@/lib/audit";
import { schemaComunicazione, type DatiComunicazione } from "@/lib/validazioni/comunicazione";
import { risolviDestinatari } from "./destinatari";
import { sostituisciVariabili } from "@/lib/email/template";
import { inviaEmail } from "@/lib/email/invio";

const RUOLI_GESTIONE_COMUNICAZIONI = ["amministratore", "segreteria"] as const;

export async function creaComunicazione(
  datiGrezzi: DatiComunicazione
): Promise<{ errore: string } | { ok: true; comunicazioneId: string }> {
  const utente = await richiediRuolo([...RUOLI_GESTIONE_COMUNICAZIONI]);
  const risultato = schemaComunicazione.safeParse(datiGrezzi);
  if (!risultato.success) return { errore: risultato.error.issues[0].message };
  const dati = risultato.data;

  const segmentoParametri =
    dati.segmento === "iscritti_corso"
      ? JSON.stringify({ corsoId: dati.corsoId })
      : dati.segmento === "personalizzato"
        ? JSON.stringify({ personaIds: dati.personaIds })
        : null;

  const comunicazione = await prisma.comunicazione.create({
    data: {
      titolo: dati.titolo,
      segmento: dati.segmento,
      segmentoParametri,
      templateOggetto: dati.templateOggetto,
      templateCorpo: dati.templateCorpo,
      createdById: utente.id,
    },
  });

  await registraAudit({ utenteId: utente.id, entita: "Comunicazione", entitaId: comunicazione.id, azione: "create" });
  revalidatePath("/comunicazioni");
  return { ok: true, comunicazioneId: comunicazione.id };
}

export async function eliminaComunicazione(comunicazioneId: string): Promise<{ errore: string } | { ok: true }> {
  const utente = await richiediRuolo([...RUOLI_GESTIONE_COMUNICAZIONI]);
  const comunicazione = await prisma.comunicazione.findUnique({ where: { id: comunicazioneId } });
  if (!comunicazione || comunicazione.deletedAt) return { errore: "Comunicazione non trovata." };
  if (comunicazione.stato !== "bozza") return { errore: "Solo una comunicazione in bozza può essere eliminata." };

  await prisma.comunicazione.update({ where: { id: comunicazioneId }, data: { deletedAt: new Date() } });
  await registraAudit({ utenteId: utente.id, entita: "Comunicazione", entitaId: comunicazioneId, azione: "delete" });
  revalidatePath("/comunicazioni");
  return { ok: true };
}

/**
 * Calcola in anteprima quanti destinatari risulterebbero per un segmento,
 * senza creare né inviare nulla: usato dal form di creazione per mostrare
 * subito quante persone riceveranno la comunicazione.
 */
export async function contaDestinatariSegmento(
  segmento: string,
  segmentoParametri: { corsoId?: string; personaIds?: string[] } | null
): Promise<number> {
  await richiediRuolo([...RUOLI_GESTIONE_COMUNICAZIONI]);
  const destinatari = await risolviDestinatari(segmento, segmentoParametri);
  return destinatari.length;
}

/**
 * Invia una comunicazione in bozza: risolve i destinatari del segmento,
 * crea una riga ComunicazioneInvio per ciascuno (anche per chi non riceve
 * l'email per consenso newsletter revocato, per lasciarne traccia) e invia
 * l'email con le variabili di template sostituite. Un fallimento di invio
 * per un singolo destinatario non blocca gli altri.
 */
export async function inviaComunicazione(comunicazioneId: string): Promise<{ errore: string } | { ok: true; inviate: number; totale: number }> {
  const utente = await richiediRuolo([...RUOLI_GESTIONE_COMUNICAZIONI]);
  const comunicazione = await prisma.comunicazione.findUnique({ where: { id: comunicazioneId } });
  if (!comunicazione || comunicazione.deletedAt) return { errore: "Comunicazione non trovata." };
  if (comunicazione.stato !== "bozza") return { errore: "Questa comunicazione è già stata inviata o è in corso di invio." };

  const segmentoParametri = comunicazione.segmentoParametri
    ? (JSON.parse(comunicazione.segmentoParametri) as { corsoId?: string; personaIds?: string[] })
    : null;
  const destinatari = await risolviDestinatari(comunicazione.segmento, segmentoParametri);
  if (destinatari.length === 0) {
    return { errore: "Nessun destinatario con email valida trovato per il segmento selezionato." };
  }

  await prisma.comunicazione.update({ where: { id: comunicazioneId }, data: { stato: "in_invio" } });

  let inviate = 0;
  for (const destinatario of destinatari) {
    const ultimoConsensoNewsletter = await prisma.consenso.findFirst({
      where: { personaId: destinatario.personaId, tipo: "newsletter_promozionale" },
      orderBy: { data: "desc" },
    });
    // Blocca solo chi ha un rifiuto/revoca esplicito registrato: l'assenza di
    // un consenso specifico (la maggior parte dei soci non è mai passata dal
    // form pubblico che lo raccoglie) non impedisce le comunicazioni
    // associative ordinarie — non è un giudizio legale definitivo, solo un
    // default ragionevole (vedi CLAUDE.md, note M9).
    const consensoNegatoORevocato =
      ultimoConsensoNewsletter?.stato === "revocato" || ultimoConsensoNewsletter?.stato === "negato";

    if (consensoNegatoORevocato) {
      await prisma.comunicazioneInvio.create({
        data: {
          comunicazioneId,
          personaId: destinatario.personaId,
          emailDestinatario: destinatario.email,
          stato: "non_inviata_per_consenso_revocato",
        },
      });
      continue;
    }

    const invio = await prisma.comunicazioneInvio.create({
      data: {
        comunicazioneId,
        personaId: destinatario.personaId,
        emailDestinatario: destinatario.email,
        stato: "in_coda",
      },
    });

    const oggetto = sostituisciVariabili(comunicazione.templateOggetto, destinatario.variabili);
    const corpo = sostituisciVariabili(comunicazione.templateCorpo, destinatario.variabili);
    const esitoInvio = await inviaEmail({ to: destinatario.email, subject: oggetto, html: corpo });

    if (esitoInvio.ok) {
      inviate += 1;
      await prisma.comunicazioneInvio.update({ where: { id: invio.id }, data: { stato: "inviata", dataInvio: new Date() } });
    } else {
      await prisma.comunicazioneInvio.update({
        where: { id: invio.id },
        data: { stato: "fallita", erroreMessaggio: esitoInvio.errore },
      });
    }
  }

  await prisma.comunicazione.update({ where: { id: comunicazioneId }, data: { stato: "inviata" } });
  await registraAudit({
    utenteId: utente.id,
    entita: "Comunicazione",
    entitaId: comunicazioneId,
    azione: "invio",
    diff: { totale: destinatari.length, inviate },
  });
  revalidatePath(`/comunicazioni/${comunicazioneId}`);
  return { ok: true, inviate, totale: destinatari.length };
}
