"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { richiediRuolo } from "@/lib/auth/richiedi-utente";
import { registraAudit } from "@/lib/audit";
import {
  schemaEvento,
  schemaCambioStatoEvento,
  schemaIncassoEvento,
  type DatiEvento,
  type DatiCambioStatoEvento,
  type DatiIncassoEvento,
} from "@/lib/validazioni/evento";

export type EsitoAzioneEvento = { errore: string } | { successo: true; eventoId: string };
export type EsitoAzione = { errore: string } | { successo: true };

const RUOLI_GESTIONE_EVENTI = ["amministratore", "segreteria"];
const RUOLI_GESTIONE_INCASSI = ["amministratore", "segreteria", "tesoriere"];

// Un solo movimento cumulativo per l'incasso di un evento (biglietti/oblazioni
// raccolti, tipicamente contati e versati una volta sola a fine serata),
// invece di generarne uno per ogni partecipazione: evita il rischio di
// doppie registrazioni quando l'incasso reale differisce dalla somma
// nominale dichiarata dai singoli partecipanti.
const CATEGORIA_DA_TIPO_INGRESSO: Record<string, string> = {
  oblazione_volontaria: "erogazioni_liberali",
  corrispettivo: "corrispettivi_specifici",
};

export async function registraIncassoEvento(eventoId: string, datiGrezzi: DatiIncassoEvento): Promise<EsitoAzione> {
  const utente = await richiediRuolo(RUOLI_GESTIONE_INCASSI);

  const risultato = schemaIncassoEvento.safeParse(datiGrezzi);
  if (!risultato.success) {
    return { errore: risultato.error.issues[0]?.message ?? "Dati non validi." };
  }
  const dati = risultato.data;

  const evento = await prisma.evento.findUnique({ where: { id: eventoId } });
  if (!evento || evento.deletedAt) return { errore: "Evento non trovato." };
  if (evento.tipoIngresso === "gratuito") {
    return { errore: "Questo evento ha ingresso gratuito: non è previsto un incasso." };
  }

  await prisma.movimentoPrimaNota.create({
    data: {
      data: new Date(dati.data),
      tipo: "entrata",
      importo: Number(dati.importo),
      contoId: dati.contoId,
      causale: dati.causale,
      categoriaRendiconto: CATEGORIA_DA_TIPO_INGRESSO[evento.tipoIngresso] ?? "altre_entrate",
      eventoId,
      createdById: utente.id,
    },
  });

  await registraAudit({ utenteId: utente.id, entita: "Evento", entitaId: eventoId, azione: "incasso" });

  revalidatePath(`/eventi/${eventoId}`);
  revalidatePath("/contabilita");
  return { successo: true };
}

export async function creaEvento(datiGrezzi: DatiEvento): Promise<EsitoAzioneEvento> {
  const utente = await richiediRuolo(RUOLI_GESTIONE_EVENTI);

  const risultato = schemaEvento.safeParse(datiGrezzi);
  if (!risultato.success) {
    return { errore: risultato.error.issues[0]?.message ?? "Dati non validi." };
  }
  const dati = risultato.data;

  const evento = await prisma.evento.create({
    data: {
      titolo: dati.titolo,
      tipologia: dati.tipologia,
      dataInizio: new Date(dati.dataInizio),
      dataFine: dati.dataFine ? new Date(dati.dataFine) : null,
      luogo: dati.luogo || null,
      descrizione: dati.descrizione || null,
      tipoIngresso: dati.tipoIngresso,
      capienza: dati.capienza ? Number(dati.capienza) : null,
      createdById: utente.id,
    },
  });

  await registraAudit({ utenteId: utente.id, entita: "Evento", entitaId: evento.id, azione: "creazione" });

  revalidatePath("/eventi");
  return { successo: true, eventoId: evento.id };
}

export async function modificaEvento(eventoId: string, datiGrezzi: DatiEvento): Promise<EsitoAzione> {
  const utente = await richiediRuolo(RUOLI_GESTIONE_EVENTI);

  const risultato = schemaEvento.safeParse(datiGrezzi);
  if (!risultato.success) {
    return { errore: risultato.error.issues[0]?.message ?? "Dati non validi." };
  }
  const dati = risultato.data;

  const evento = await prisma.evento.findUnique({ where: { id: eventoId } });
  if (!evento || evento.deletedAt) return { errore: "Evento non trovato." };

  await prisma.evento.update({
    where: { id: eventoId },
    data: {
      titolo: dati.titolo,
      tipologia: dati.tipologia,
      dataInizio: new Date(dati.dataInizio),
      dataFine: dati.dataFine ? new Date(dati.dataFine) : null,
      luogo: dati.luogo || null,
      descrizione: dati.descrizione || null,
      tipoIngresso: dati.tipoIngresso,
      capienza: dati.capienza ? Number(dati.capienza) : null,
    },
  });

  await registraAudit({ utenteId: utente.id, entita: "Evento", entitaId: eventoId, azione: "modifica" });

  revalidatePath("/eventi");
  revalidatePath(`/eventi/${eventoId}`);
  return { successo: true };
}

export async function cambiaStatoEvento(eventoId: string, datiGrezzi: DatiCambioStatoEvento): Promise<EsitoAzione> {
  const utente = await richiediRuolo(RUOLI_GESTIONE_EVENTI);

  const risultato = schemaCambioStatoEvento.safeParse(datiGrezzi);
  if (!risultato.success) {
    return { errore: risultato.error.issues[0]?.message ?? "Stato non valido." };
  }

  const evento = await prisma.evento.findUnique({ where: { id: eventoId } });
  if (!evento || evento.deletedAt) return { errore: "Evento non trovato." };

  await prisma.evento.update({ where: { id: eventoId }, data: { stato: risultato.data.stato } });

  await registraAudit({
    utenteId: utente.id,
    entita: "Evento",
    entitaId: eventoId,
    azione: "cambio_stato",
    diff: { stato: risultato.data.stato },
  });

  revalidatePath(`/eventi/${eventoId}`);
  revalidatePath("/eventi");
  return { successo: true };
}
