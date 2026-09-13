"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { richiediRuolo } from "@/lib/auth/richiedi-utente";
import { registraAudit } from "@/lib/audit";
import { generaCalendarioLezioni } from "./calendario";
import {
  schemaCorso,
  schemaModificaCorso,
  schemaCambioStatoCorso,
  schemaDocenteCorso,
  schemaLezioneManuale,
  schemaModificaLezione,
  type DatiCorso,
  type DatiModificaCorso,
  type DatiCambioStatoCorso,
  type DatiDocenteCorso,
  type DatiLezioneManuale,
  type DatiModificaLezione,
} from "@/lib/validazioni/corso";

export type EsitoAzioneCorso = { errore: string } | { successo: true; corsoId: string };
export type EsitoAzione = { errore: string } | { successo: true };

const RUOLI_GESTIONE_CORSI = ["amministratore", "segreteria"];

/**
 * Crea un corso e, se richiesto, genera automaticamente il calendario delle
 * lezioni dalla cadenza settimanale indicata (§6 M4). Tutto in un'unica
 * transazione: se la generazione del calendario fallisce (es. parametri
 * incoerenti), il corso non viene creato.
 */
export async function creaCorso(datiGrezzi: DatiCorso): Promise<EsitoAzioneCorso> {
  const utente = await richiediRuolo(RUOLI_GESTIONE_CORSI);

  const risultato = schemaCorso.safeParse(datiGrezzi);
  if (!risultato.success) {
    return { errore: risultato.error.issues[0]?.message ?? "Dati non validi." };
  }
  const dati = risultato.data;
  const dataInizio = new Date(dati.dataInizio);

  let lezioniGenerate: Date[] = [];
  const durataOreLezione = Number(dati.durataOreLezione || 0);
  if (dati.generaCalendario) {
    try {
      lezioniGenerate = generaCalendarioLezioni({
        dataInizio,
        numeroLezioni: Number(dati.numeroLezioni),
        giorniSettimana: dati.giorniSettimana ?? [],
        festivita: (dati.festivita ?? []).map((f) => new Date(f)),
      });
    } catch (errore) {
      return { errore: errore instanceof Error ? errore.message : "Impossibile generare il calendario." };
    }
  }

  const corsoId = await prisma.$transaction(async (tx) => {
    const corso = await tx.corso.create({
      data: {
        titolo: dati.titolo,
        edizione: dati.edizione || null,
        descrizione: dati.descrizione || null,
        destinatari: dati.destinatari || null,
        sede: dati.sede || null,
        dataInizio,
        dataFine: lezioniGenerate.length > 0 ? lezioniGenerate[lezioniGenerate.length - 1] : null,
        numeroLezioniPreviste: dati.generaCalendario ? Number(dati.numeroLezioni) : null,
        oreTotali: dati.generaCalendario ? Number(dati.numeroLezioni) * durataOreLezione : null,
        capienzaMassima: dati.capienzaMassima ? Number(dati.capienzaMassima) : null,
        quotaPartecipazione: dati.quotaPartecipazione ? Number(dati.quotaPartecipazione) : null,
        percentualeMinimaPresenzaAttestato: Number(dati.percentualeMinimaPresenzaAttestato),
        createdById: utente.id,
      },
    });

    if (lezioniGenerate.length > 0) {
      await tx.lezione.createMany({
        data: lezioniGenerate.map((data, indice) => ({
          corsoId: corso.id,
          numeroProgressivo: indice + 1,
          data,
          oraInizio: dati.oraInizioLezione || "00:00",
          oraFine: dati.oraFineLezione || "00:00",
          durataOre: durataOreLezione,
        })),
      });
    }

    return corso.id;
  });

  await registraAudit({ utenteId: utente.id, entita: "Corso", entitaId: corsoId, azione: "creazione" });

  revalidatePath("/corsi");
  return { successo: true, corsoId };
}

export async function modificaCorso(corsoId: string, datiGrezzi: DatiModificaCorso): Promise<EsitoAzione> {
  const utente = await richiediRuolo(RUOLI_GESTIONE_CORSI);

  const risultato = schemaModificaCorso.safeParse(datiGrezzi);
  if (!risultato.success) {
    return { errore: risultato.error.issues[0]?.message ?? "Dati non validi." };
  }
  const dati = risultato.data;

  const corso = await prisma.corso.findUnique({ where: { id: corsoId } });
  if (!corso || corso.deletedAt) return { errore: "Corso non trovato." };

  await prisma.corso.update({
    where: { id: corsoId },
    data: {
      titolo: dati.titolo,
      edizione: dati.edizione || null,
      descrizione: dati.descrizione || null,
      destinatari: dati.destinatari || null,
      sede: dati.sede || null,
      dataInizio: new Date(dati.dataInizio),
      dataFine: dati.dataFine ? new Date(dati.dataFine) : null,
      capienzaMassima: dati.capienzaMassima ? Number(dati.capienzaMassima) : null,
      quotaPartecipazione: dati.quotaPartecipazione ? Number(dati.quotaPartecipazione) : null,
      percentualeMinimaPresenzaAttestato: Number(dati.percentualeMinimaPresenzaAttestato),
    },
  });

  await registraAudit({ utenteId: utente.id, entita: "Corso", entitaId: corsoId, azione: "modifica" });

  revalidatePath("/corsi");
  revalidatePath(`/corsi/${corsoId}`);
  return { successo: true };
}

export async function cambiaStatoCorso(corsoId: string, datiGrezzi: DatiCambioStatoCorso): Promise<EsitoAzione> {
  const utente = await richiediRuolo(RUOLI_GESTIONE_CORSI);

  const risultato = schemaCambioStatoCorso.safeParse(datiGrezzi);
  if (!risultato.success) {
    return { errore: risultato.error.issues[0]?.message ?? "Stato non valido." };
  }

  const corso = await prisma.corso.findUnique({ where: { id: corsoId } });
  if (!corso || corso.deletedAt) return { errore: "Corso non trovato." };

  await prisma.corso.update({ where: { id: corsoId }, data: { stato: risultato.data.stato } });

  await registraAudit({
    utenteId: utente.id,
    entita: "Corso",
    entitaId: corsoId,
    azione: "cambio_stato",
    diff: { stato: risultato.data.stato },
  });

  revalidatePath(`/corsi/${corsoId}`);
  revalidatePath("/corsi");
  return { successo: true };
}

export async function aggiungiDocente(corsoId: string, datiGrezzi: DatiDocenteCorso): Promise<EsitoAzione> {
  const utente = await richiediRuolo(RUOLI_GESTIONE_CORSI);

  const risultato = schemaDocenteCorso.safeParse(datiGrezzi);
  if (!risultato.success) {
    return { errore: risultato.error.issues[0]?.message ?? "Dati non validi." };
  }

  const corso = await prisma.corso.findUnique({ where: { id: corsoId } });
  if (!corso || corso.deletedAt) return { errore: "Corso non trovato." };

  const giaAssegnato = await prisma.corsoDocente.findUnique({
    where: { corsoId_personaId: { corsoId, personaId: risultato.data.personaId } },
  });
  if (giaAssegnato) return { errore: "Questa persona è già docente di questo corso." };

  await prisma.corsoDocente.create({ data: { corsoId, personaId: risultato.data.personaId } });

  await registraAudit({ utenteId: utente.id, entita: "Corso", entitaId: corsoId, azione: "aggiunta_docente" });

  revalidatePath(`/corsi/${corsoId}`);
  return { successo: true };
}

export async function rimuoviDocente(corsoId: string, corsoDocenteId: string): Promise<EsitoAzione> {
  const utente = await richiediRuolo(RUOLI_GESTIONE_CORSI);

  const riga = await prisma.corsoDocente.findUnique({ where: { id: corsoDocenteId } });
  if (!riga || riga.corsoId !== corsoId) return { errore: "Assegnazione non trovata." };

  await prisma.corsoDocente.delete({ where: { id: corsoDocenteId } });

  await registraAudit({ utenteId: utente.id, entita: "Corso", entitaId: corsoId, azione: "rimozione_docente" });

  revalidatePath(`/corsi/${corsoId}`);
  return { successo: true };
}

export async function aggiungiLezioneManuale(
  corsoId: string,
  datiGrezzi: DatiLezioneManuale
): Promise<EsitoAzione> {
  const utente = await richiediRuolo(RUOLI_GESTIONE_CORSI);

  const risultato = schemaLezioneManuale.safeParse(datiGrezzi);
  if (!risultato.success) {
    return { errore: risultato.error.issues[0]?.message ?? "Dati non validi." };
  }
  const dati = risultato.data;

  const corso = await prisma.corso.findUnique({ where: { id: corsoId } });
  if (!corso || corso.deletedAt) return { errore: "Corso non trovato." };

  await prisma.$transaction(async (tx) => {
    const ultima = await tx.lezione.findFirst({
      where: { corsoId },
      orderBy: { numeroProgressivo: "desc" },
    });

    await tx.lezione.create({
      data: {
        corsoId,
        numeroProgressivo: (ultima?.numeroProgressivo ?? 0) + 1,
        titolo: dati.titolo || null,
        argomenti: dati.argomenti || null,
        data: new Date(dati.data),
        oraInizio: dati.oraInizio,
        oraFine: dati.oraFine,
        durataOre: Number(dati.durataOre),
        aulaSede: dati.aulaSede || null,
        docenteEffettivoId: dati.docenteEffettivoId || null,
      },
    });
  });

  await registraAudit({ utenteId: utente.id, entita: "Corso", entitaId: corsoId, azione: "aggiunta_lezione" });

  revalidatePath(`/corsi/${corsoId}`);
  return { successo: true };
}

export async function modificaLezione(
  lezioneId: string,
  datiGrezzi: DatiModificaLezione
): Promise<EsitoAzione> {
  const utente = await richiediRuolo([...RUOLI_GESTIONE_CORSI, "docente"]);

  const risultato = schemaModificaLezione.safeParse(datiGrezzi);
  if (!risultato.success) {
    return { errore: risultato.error.issues[0]?.message ?? "Dati non validi." };
  }

  const lezione = await prisma.lezione.findUnique({ where: { id: lezioneId } });
  if (!lezione || lezione.deletedAt) return { errore: "Lezione non trovata." };

  if (utente.ruolo === "docente") {
    const assegnato = await prisma.corsoDocente.findFirst({
      where: { corsoId: lezione.corsoId, personaId: utente.personaId ?? "" },
    });
    if (!assegnato) return { errore: "Non sei docente di questo corso." };
  }

  await prisma.lezione.update({
    where: { id: lezioneId },
    data: { stato: risultato.data.stato, noteDocente: risultato.data.noteDocente || null },
  });

  await registraAudit({
    utenteId: utente.id,
    entita: "Lezione",
    entitaId: lezioneId,
    azione: "modifica",
    diff: { stato: risultato.data.stato },
  });

  revalidatePath(`/corsi/${lezione.corsoId}`);
  return { successo: true };
}
