"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { richiediRuolo } from "@/lib/auth/richiedi-utente";
import { registraAudit } from "@/lib/audit";
import {
  schemaTurnoVolontario,
  STATI_TURNO_VOLONTARIO,
  type DatiTurnoVolontario,
} from "@/lib/validazioni/evento";

export type EsitoAzione = { errore: string } | { successo: true };

const RUOLI_GESTIONE_EVENTI = ["amministratore", "segreteria"];

export async function proponiTurnoVolontario(eventoId: string, datiGrezzi: DatiTurnoVolontario): Promise<EsitoAzione> {
  const utente = await richiediRuolo(RUOLI_GESTIONE_EVENTI);

  const risultato = schemaTurnoVolontario.safeParse(datiGrezzi);
  if (!risultato.success) {
    return { errore: risultato.error.issues[0]?.message ?? "Dati non validi." };
  }
  const dati = risultato.data;

  const evento = await prisma.evento.findUnique({ where: { id: eventoId } });
  if (!evento || evento.deletedAt) return { errore: "Evento non trovato." };

  await prisma.turnoVolontario.create({
    data: {
      eventoId,
      volontarioId: dati.volontarioId,
      mansione: dati.mansione,
      oraInizio: dati.oraInizio || null,
      oraFine: dati.oraFine || null,
    },
  });

  await registraAudit({ utenteId: utente.id, entita: "Evento", entitaId: eventoId, azione: "proposta_turno" });

  revalidatePath(`/eventi/${eventoId}`);
  return { successo: true };
}

export async function cambiaStatoTurnoVolontario(
  eventoId: string,
  turnoId: string,
  stato: (typeof STATI_TURNO_VOLONTARIO)[number]
): Promise<EsitoAzione> {
  const utente = await richiediRuolo(RUOLI_GESTIONE_EVENTI);

  const turno = await prisma.turnoVolontario.findUnique({ where: { id: turnoId } });
  if (!turno || turno.eventoId !== eventoId) return { errore: "Turno non trovato." };
  if (!STATI_TURNO_VOLONTARIO.includes(stato)) return { errore: "Stato non valido." };

  await prisma.turnoVolontario.update({ where: { id: turnoId }, data: { stato } });

  await registraAudit({
    utenteId: utente.id,
    entita: "Evento",
    entitaId: eventoId,
    azione: "cambio_stato_turno",
    diff: { stato },
  });

  revalidatePath(`/eventi/${eventoId}`);
  return { successo: true };
}

export async function rimuoviTurnoVolontario(eventoId: string, turnoId: string): Promise<EsitoAzione> {
  const utente = await richiediRuolo(RUOLI_GESTIONE_EVENTI);

  const turno = await prisma.turnoVolontario.findUnique({ where: { id: turnoId } });
  if (!turno || turno.eventoId !== eventoId) return { errore: "Turno non trovato." };

  await prisma.turnoVolontario.delete({ where: { id: turnoId } });

  await registraAudit({ utenteId: utente.id, entita: "Evento", entitaId: eventoId, azione: "rimozione_turno" });

  revalidatePath(`/eventi/${eventoId}`);
  return { successo: true };
}
