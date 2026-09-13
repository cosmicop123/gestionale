"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { richiediRuolo } from "@/lib/auth/richiedi-utente";
import { registraAudit } from "@/lib/audit";
import { schemaPartecipazioneEvento, type DatiPartecipazioneEvento } from "@/lib/validazioni/evento";

export type EsitoAzione = { errore: string } | { successo: true };
export type EsitoCheckIn = { errore: string } | { successo: true; nome: string };

const RUOLI_GESTIONE_EVENTI = ["amministratore", "segreteria"];
const RUOLI_CHECK_IN = ["amministratore", "segreteria", "sola_lettura"];

export async function registraPartecipazione(
  eventoId: string,
  datiGrezzi: DatiPartecipazioneEvento
): Promise<EsitoAzione> {
  const utente = await richiediRuolo(RUOLI_GESTIONE_EVENTI);

  const risultato = schemaPartecipazioneEvento.safeParse(datiGrezzi);
  if (!risultato.success) {
    return { errore: risultato.error.issues[0]?.message ?? "Dati non validi." };
  }
  const dati = risultato.data;

  const evento = await prisma.evento.findUnique({ where: { id: eventoId } });
  if (!evento || evento.deletedAt) return { errore: "Evento non trovato." };

  if (evento.capienza !== null) {
    const iscritti = await prisma.partecipazioneEvento.count({ where: { eventoId } });
    if (iscritti >= evento.capienza) {
      return { errore: "La capienza massima dell'evento è già stata raggiunta." };
    }
  }

  await prisma.partecipazioneEvento.create({
    data: {
      eventoId,
      personaId: dati.personaId || null,
      nomeLibero: dati.personaId ? null : dati.nomeLibero || null,
      bigliettoOblazione: dati.bigliettoOblazione ? Number(dati.bigliettoOblazione) : null,
    },
  });

  await registraAudit({ utenteId: utente.id, entita: "Evento", entitaId: eventoId, azione: "aggiunta_partecipante" });

  revalidatePath(`/eventi/${eventoId}`);
  return { successo: true };
}

export async function rimuoviPartecipazione(eventoId: string, partecipazioneId: string): Promise<EsitoAzione> {
  const utente = await richiediRuolo(RUOLI_GESTIONE_EVENTI);

  const partecipazione = await prisma.partecipazioneEvento.findUnique({ where: { id: partecipazioneId } });
  if (!partecipazione || partecipazione.eventoId !== eventoId) return { errore: "Partecipazione non trovata." };

  // Non è un'entità append-only per specifica (solo libro soci, ricevute,
  // prima nota e audit log lo sono): una correzione qui è una cancellazione
  // reale, non uno storno.
  await prisma.partecipazioneEvento.delete({ where: { id: partecipazioneId } });

  await registraAudit({ utenteId: utente.id, entita: "Evento", entitaId: eventoId, azione: "rimozione_partecipante" });

  revalidatePath(`/eventi/${eventoId}`);
  return { successo: true };
}

async function registraCheckInComune(
  eventoId: string,
  partecipazioneId: string,
  metodo: "manuale" | "qr"
): Promise<EsitoCheckIn> {
  const partecipazione = await prisma.partecipazioneEvento.findUnique({
    where: { id: partecipazioneId },
    include: { persona: true },
  });
  if (!partecipazione || partecipazione.eventoId !== eventoId) {
    return { errore: "Partecipazione non trovata per questo evento." };
  }

  await prisma.partecipazioneEvento.update({
    where: { id: partecipazioneId },
    data: { checkInQr: metodo === "qr", dataCheckIn: new Date() },
  });

  revalidatePath(`/eventi/${eventoId}`);
  const nome = partecipazione.persona
    ? `${partecipazione.persona.cognome} ${partecipazione.persona.nome}`
    : partecipazione.nomeLibero ?? "Partecipante";
  return { successo: true, nome };
}

export async function registraCheckIn(eventoId: string, partecipazioneId: string): Promise<EsitoCheckIn> {
  await richiediRuolo(RUOLI_CHECK_IN);
  return registraCheckInComune(eventoId, partecipazioneId, "manuale");
}

export async function registraCheckInQr(eventoId: string, partecipazioneId: string): Promise<EsitoCheckIn> {
  await richiediRuolo(RUOLI_CHECK_IN);
  return registraCheckInComune(eventoId, partecipazioneId, "qr");
}
