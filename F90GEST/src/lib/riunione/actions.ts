"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { richiediRuolo } from "@/lib/auth/richiedi-utente";
import { registraAudit } from "@/lib/audit";
import { prossimoNumero } from "@/lib/numeratore";
import {
  schemaRiunione,
  schemaPartecipanteRiunione,
  schemaDelibera,
  schemaVerbale,
  type DatiRiunione,
  type DatiPartecipanteRiunione,
  type DatiDelibera,
  type DatiVerbale,
} from "@/lib/validazioni/riunione";

export type EsitoAzioneRiunione = { errore: string } | { successo: true; riunioneId: string };
export type EsitoAzione = { errore: string } | { successo: true };

const RUOLI_GESTIONE = ["amministratore", "segreteria"];

export async function creaRiunione(datiGrezzi: DatiRiunione): Promise<EsitoAzioneRiunione> {
  const utente = await richiediRuolo(RUOLI_GESTIONE);

  const risultato = schemaRiunione.safeParse(datiGrezzi);
  if (!risultato.success) {
    return { errore: risultato.error.issues[0]?.message ?? "Dati non validi." };
  }
  const dati = risultato.data;

  const riunioneId = await prisma.$transaction(async (tx) => {
    const numeroProgressivo = await prossimoNumero(tx, `riunione_${dati.tipo}`);

    const riunione = await tx.riunione.create({
      data: {
        tipo: dati.tipo,
        data: new Date(dati.data),
        ora: dati.ora || null,
        sede: dati.sede || null,
        ordineDelGiorno: dati.ordineDelGiorno,
        numeroProgressivo,
        createdById: utente.id,
      },
    });
    return riunione.id;
  });

  await registraAudit({ utenteId: utente.id, entita: "Riunione", entitaId: riunioneId, azione: "creazione" });

  revalidatePath("/libri-sociali");
  return { successo: true, riunioneId };
}

export async function aggiungiPartecipanteRiunione(
  riunioneId: string,
  datiGrezzi: DatiPartecipanteRiunione
): Promise<EsitoAzione> {
  const utente = await richiediRuolo(RUOLI_GESTIONE);

  const risultato = schemaPartecipanteRiunione.safeParse(datiGrezzi);
  if (!risultato.success) {
    return { errore: risultato.error.issues[0]?.message ?? "Dati non validi." };
  }
  const dati = risultato.data;

  const riunione = await prisma.riunione.findUnique({ where: { id: riunioneId } });
  if (!riunione || riunione.deletedAt) return { errore: "Riunione non trovata." };

  const esistente = await prisma.riunionePartecipante.findUnique({
    where: { riunioneId_personaId: { riunioneId, personaId: dati.personaId } },
  });
  if (esistente) return { errore: "Questa persona è già tra i convocati." };

  await prisma.riunionePartecipante.create({
    data: {
      riunioneId,
      personaId: dati.personaId,
      convocato: dati.convocato,
      delegatoDaId: dati.delegatoDaId || null,
    },
  });

  await registraAudit({ utenteId: utente.id, entita: "Riunione", entitaId: riunioneId, azione: "aggiunta_partecipante" });

  revalidatePath(`/libri-sociali/riunioni/${riunioneId}`);
  return { successo: true };
}

export async function segnaPresenzaRiunione(
  riunioneId: string,
  partecipanteId: string,
  presente: boolean
): Promise<EsitoAzione> {
  const utente = await richiediRuolo(RUOLI_GESTIONE);

  const partecipante = await prisma.riunionePartecipante.findUnique({ where: { id: partecipanteId } });
  if (!partecipante || partecipante.riunioneId !== riunioneId) return { errore: "Partecipante non trovato." };

  await prisma.riunionePartecipante.update({ where: { id: partecipanteId }, data: { presente } });

  await registraAudit({ utenteId: utente.id, entita: "Riunione", entitaId: riunioneId, azione: "presenza" });

  revalidatePath(`/libri-sociali/riunioni/${riunioneId}`);
  return { successo: true };
}

export async function rimuoviPartecipanteRiunione(riunioneId: string, partecipanteId: string): Promise<EsitoAzione> {
  const utente = await richiediRuolo(RUOLI_GESTIONE);

  const partecipante = await prisma.riunionePartecipante.findUnique({ where: { id: partecipanteId } });
  if (!partecipante || partecipante.riunioneId !== riunioneId) return { errore: "Partecipante non trovato." };

  await prisma.riunionePartecipante.delete({ where: { id: partecipanteId } });

  await registraAudit({ utenteId: utente.id, entita: "Riunione", entitaId: riunioneId, azione: "rimozione_partecipante" });

  revalidatePath(`/libri-sociali/riunioni/${riunioneId}`);
  return { successo: true };
}

export async function impostaQuorum(
  riunioneId: string,
  dati: { quorumCostitutivoVerificato?: boolean; quorumDeliberativoVerificato?: boolean }
): Promise<EsitoAzione> {
  const utente = await richiediRuolo(RUOLI_GESTIONE);

  const riunione = await prisma.riunione.findUnique({ where: { id: riunioneId } });
  if (!riunione || riunione.deletedAt) return { errore: "Riunione non trovata." };

  await prisma.riunione.update({
    where: { id: riunioneId },
    data: {
      quorumCostitutivoVerificato: dati.quorumCostitutivoVerificato,
      quorumDeliberativoVerificato: dati.quorumDeliberativoVerificato,
    },
  });

  await registraAudit({ utenteId: utente.id, entita: "Riunione", entitaId: riunioneId, azione: "verifica_quorum" });

  revalidatePath(`/libri-sociali/riunioni/${riunioneId}`);
  return { successo: true };
}

export async function aggiungiDelibera(riunioneId: string, datiGrezzi: DatiDelibera): Promise<EsitoAzione> {
  const utente = await richiediRuolo(RUOLI_GESTIONE);

  const risultato = schemaDelibera.safeParse(datiGrezzi);
  if (!risultato.success) {
    return { errore: risultato.error.issues[0]?.message ?? "Dati non validi." };
  }
  const dati = risultato.data;

  const riunione = await prisma.riunione.findUnique({ where: { id: riunioneId } });
  if (!riunione || riunione.deletedAt) return { errore: "Riunione non trovata." };

  await prisma.delibera.create({
    data: {
      riunioneId,
      oggetto: dati.oggetto,
      esito: dati.esito,
      votiFavorevoli: dati.votiFavorevoli ? Number(dati.votiFavorevoli) : null,
      votiContrari: dati.votiContrari ? Number(dati.votiContrari) : null,
      votiAstenuti: dati.votiAstenuti ? Number(dati.votiAstenuti) : null,
    },
  });

  await registraAudit({ utenteId: utente.id, entita: "Riunione", entitaId: riunioneId, azione: "aggiunta_delibera" });

  revalidatePath(`/libri-sociali/riunioni/${riunioneId}`);
  return { successo: true };
}

export async function salvaVerbale(riunioneId: string, datiGrezzi: DatiVerbale): Promise<EsitoAzione> {
  const utente = await richiediRuolo(RUOLI_GESTIONE);

  const risultato = schemaVerbale.safeParse(datiGrezzi);
  if (!risultato.success) {
    return { errore: risultato.error.issues[0]?.message ?? "Dati non validi." };
  }

  const riunione = await prisma.riunione.findUnique({ where: { id: riunioneId } });
  if (!riunione || riunione.deletedAt) return { errore: "Riunione non trovata." };

  await prisma.riunione.update({ where: { id: riunioneId }, data: { verbaleTesto: risultato.data.verbaleTesto } });

  await registraAudit({ utenteId: utente.id, entita: "Riunione", entitaId: riunioneId, azione: "salvataggio_verbale" });

  revalidatePath(`/libri-sociali/riunioni/${riunioneId}`);
  return { successo: true };
}
