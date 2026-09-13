"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { richiediRuolo } from "@/lib/auth/richiedi-utente";
import { registraAudit } from "@/lib/audit";
import { salvaAllegato } from "@/lib/storage";
import { schemaPraticaSiae, schemaBranoProgramma, type DatiPraticaSiae, type DatiBranoProgramma } from "@/lib/validazioni/evento";

export type EsitoAzione = { errore: string } | { successo: true };

const RUOLI_GESTIONE_EVENTI = ["amministratore", "segreteria"];

/**
 * Crea o aggiorna la pratica SIAE dell'evento (relazione 1:1, `eventoId`
 * univoco nello schema): un upsert esplicito perché l'indice unico su
 * `eventoId` funziona correttamente con `upsert` qui (a differenza del caso
 * di `Numeratore` documentato in CLAUDE.md, questa chiave non è mai null).
 */
export async function salvaPraticaSiae(eventoId: string, datiGrezzi: DatiPraticaSiae): Promise<EsitoAzione> {
  const utente = await richiediRuolo(RUOLI_GESTIONE_EVENTI);

  const risultato = schemaPraticaSiae.safeParse(datiGrezzi);
  if (!risultato.success) {
    return { errore: risultato.error.issues[0]?.message ?? "Dati non validi." };
  }
  const dati = risultato.data;

  const evento = await prisma.evento.findUnique({ where: { id: eventoId } });
  if (!evento || evento.deletedAt) return { errore: "Evento non trovato." };

  const valori = {
    tipoPermesso: dati.tipoPermesso,
    dataInvio: dati.dataInvio ? new Date(dati.dataInvio) : null,
    protocollo: dati.protocollo || null,
    minimoGarantito: dati.minimoGarantito ? Number(dati.minimoGarantito) : null,
    importoPagato: dati.importoPagato ? Number(dati.importoPagato) : null,
    conguaglio: dati.conguaglio ? Number(dati.conguaglio) : null,
    stato: dati.stato,
  };

  await prisma.praticaSIAE.upsert({
    where: { eventoId },
    update: valori,
    create: { eventoId, ...valori },
  });

  await registraAudit({ utenteId: utente.id, entita: "Evento", entitaId: eventoId, azione: "salvataggio_pratica_siae" });

  revalidatePath(`/eventi/${eventoId}`);
  return { successo: true };
}

export async function caricaBorderoPraticaSiae(eventoId: string, formData: FormData): Promise<EsitoAzione> {
  const utente = await richiediRuolo(RUOLI_GESTIONE_EVENTI);

  const pratica = await prisma.praticaSIAE.findUnique({ where: { eventoId } });
  if (!pratica) return { errore: "Predisporre prima la pratica SIAE." };

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { errore: "Selezionare un file da caricare." };
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const allegato = await salvaAllegato({
    entitaTipo: "PraticaSIAE",
    entitaId: pratica.id,
    nomeFileOriginale: file.name,
    mimeType: file.type || "application/octet-stream",
    buffer,
    createdById: utente.id,
  });

  await prisma.praticaSIAE.update({ where: { id: pratica.id }, data: { borderoAllegatoId: allegato.id } });

  await registraAudit({ utenteId: utente.id, entita: "Evento", entitaId: eventoId, azione: "caricamento_bordero" });

  revalidatePath(`/eventi/${eventoId}`);
  return { successo: true };
}

export async function aggiungiBranoAProgramma(eventoId: string, datiGrezzi: DatiBranoProgramma): Promise<EsitoAzione> {
  const utente = await richiediRuolo(RUOLI_GESTIONE_EVENTI);

  const risultato = schemaBranoProgramma.safeParse(datiGrezzi);
  if (!risultato.success) {
    return { errore: risultato.error.issues[0]?.message ?? "Dati non validi." };
  }
  const dati = risultato.data;

  const pratica = await prisma.praticaSIAE.findUnique({ where: { eventoId } });
  if (!pratica) return { errore: "Predisporre prima la pratica SIAE." };

  await prisma.$transaction(async (tx) => {
    const brano = dati.branoEsistenteId
      ? await tx.branoMusicale.findUniqueOrThrow({ where: { id: dati.branoEsistenteId } })
      : await tx.branoMusicale.create({
          data: { titolo: dati.titolo!, autore: dati.autore!, editore: dati.editore || null },
        });

    await tx.programmaMusicalePratica.create({
      data: {
        praticaId: pratica.id,
        branoId: brano.id,
        ordineEsecuzione: dati.ordineEsecuzione ? Number(dati.ordineEsecuzione) : null,
      },
    });
  });

  await registraAudit({ utenteId: utente.id, entita: "Evento", entitaId: eventoId, azione: "aggiunta_brano_programma" });

  revalidatePath(`/eventi/${eventoId}`);
  return { successo: true };
}

export async function rimuoviBranoDaProgramma(eventoId: string, programmaId: string): Promise<EsitoAzione> {
  const utente = await richiediRuolo(RUOLI_GESTIONE_EVENTI);

  const riga = await prisma.programmaMusicalePratica.findUnique({
    where: { id: programmaId },
    include: { pratica: true },
  });
  if (!riga || riga.pratica.eventoId !== eventoId) return { errore: "Brano non trovato in questo programma." };

  await prisma.programmaMusicalePratica.delete({ where: { id: programmaId } });

  await registraAudit({ utenteId: utente.id, entita: "Evento", entitaId: eventoId, azione: "rimozione_brano_programma" });

  revalidatePath(`/eventi/${eventoId}`);
  return { successo: true };
}
