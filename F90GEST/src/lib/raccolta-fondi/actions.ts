"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { richiediRuolo } from "@/lib/auth/richiedi-utente";
import { registraAudit } from "@/lib/audit";
import {
  schemaRaccoltaFondi,
  schemaMovimentoRaccoltaFondi,
  type DatiRaccoltaFondi,
  type DatiMovimentoRaccoltaFondi,
} from "@/lib/validazioni/evento";

export type EsitoAzioneRaccolta = { errore: string } | { successo: true; raccoltaFondiId: string };
export type EsitoAzione = { errore: string } | { successo: true };

const RUOLI_GESTIONE_EVENTI = ["amministratore", "segreteria"];
const RUOLI_GESTIONE_INCASSI = ["amministratore", "segreteria", "tesoriere"];

export async function creaRaccoltaFondi(datiGrezzi: DatiRaccoltaFondi): Promise<EsitoAzioneRaccolta> {
  const utente = await richiediRuolo(RUOLI_GESTIONE_EVENTI);

  const risultato = schemaRaccoltaFondi.safeParse(datiGrezzi);
  if (!risultato.success) {
    return { errore: risultato.error.issues[0]?.message ?? "Dati non validi." };
  }
  const dati = risultato.data;

  const raccolta = await prisma.raccoltaFondi.create({
    data: {
      denominazione: dati.denominazione,
      periodoInizio: new Date(dati.periodoInizio),
      periodoFine: dati.periodoFine ? new Date(dati.periodoFine) : null,
      eventoId: dati.eventoId || null,
    },
  });

  await registraAudit({ utenteId: utente.id, entita: "RaccoltaFondi", entitaId: raccolta.id, azione: "creazione" });

  revalidatePath("/eventi/raccolte-fondi");
  return { successo: true, raccoltaFondiId: raccolta.id };
}

/**
 * Registra un movimento di prima nota collegato alla raccolta fondi
 * occasionale (§7.3, natura fiscale "raccolta_fondi_occasionale" — la
 * categoria di rendiconto resta comunque "raccolte_fondi" anche per le
 * uscite legate all'iniziativa, per tenerle raggruppate nel rendiconto).
 */
export async function registraMovimentoRaccoltaFondi(
  raccoltaFondiId: string,
  datiGrezzi: DatiMovimentoRaccoltaFondi
): Promise<EsitoAzione> {
  const utente = await richiediRuolo(RUOLI_GESTIONE_INCASSI);

  const risultato = schemaMovimentoRaccoltaFondi.safeParse(datiGrezzi);
  if (!risultato.success) {
    return { errore: risultato.error.issues[0]?.message ?? "Dati non validi." };
  }
  const dati = risultato.data;

  const raccolta = await prisma.raccoltaFondi.findUnique({ where: { id: raccoltaFondiId } });
  if (!raccolta || raccolta.deletedAt) return { errore: "Raccolta fondi non trovata." };

  await prisma.movimentoPrimaNota.create({
    data: {
      data: new Date(dati.data),
      tipo: dati.tipo,
      importo: Number(dati.importo),
      contoId: dati.contoId,
      causale: dati.causale,
      categoriaRendiconto: "raccolte_fondi",
      raccoltaFondiId,
      createdById: utente.id,
    },
  });

  await registraAudit({
    utenteId: utente.id,
    entita: "RaccoltaFondi",
    entitaId: raccoltaFondiId,
    azione: "registrazione_movimento",
  });

  revalidatePath(`/eventi/raccolte-fondi/${raccoltaFondiId}`);
  revalidatePath("/contabilita");
  return { successo: true };
}
