"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { richiediRuolo } from "@/lib/auth/richiedi-utente";
import { registraAudit } from "@/lib/audit";
import { schemaEnte, type DatiEnte } from "@/lib/validazioni/ente";

export type EsitoSalvaEnte = { errore: string } | { successo: true };

/**
 * Salva l'anagrafica dell'ente. Usata sia dal wizard di primo avvio
 * (`segnaConfigurazioneCompletata: true`) sia dalla pagina di
 * amministrazione per le modifiche successive.
 */
export async function salvaDatiEnte(
  datiGrezzi: DatiEnte,
  opzioni: { segnaConfigurazioneCompletata?: boolean } = {}
): Promise<EsitoSalvaEnte> {
  const utente = await richiediRuolo(["amministratore"]);

  const risultato = schemaEnte.safeParse(datiGrezzi);
  if (!risultato.success) {
    return { errore: risultato.error.issues[0]?.message ?? "Dati non validi." };
  }
  const dati = risultato.data;

  const associazioneEsistente = await prisma.associazione.findFirst();
  if (!associazioneEsistente) {
    return { errore: "Anagrafica ente non trovata: contattare l'assistenza tecnica." };
  }

  const datiAggiornati = {
    denominazione: dati.denominazione,
    codiceFiscale: dati.codiceFiscale,
    partitaIva: dati.partitaIva || null,
    sedeLegaleVia: dati.sedeLegaleVia,
    sedeLegaleCap: dati.sedeLegaleCap,
    sedeLegaleComune: dati.sedeLegaleComune,
    sedeLegaleProvincia: dati.sedeLegaleProvincia,
    sedeOperativaVia: dati.sedeOperativaVia || null,
    sedeOperativaCap: dati.sedeOperativaCap || null,
    sedeOperativaComune: dati.sedeOperativaComune || null,
    sedeOperativaProvincia: dati.sedeOperativaProvincia || null,
    pec: dati.pec || null,
    email: dati.email || null,
    telefono: dati.telefono || null,
    iban: dati.iban || null,
    dataCostituzione: dati.dataCostituzione ? new Date(dati.dataCostituzione) : null,
    statutoRiferimento: dati.statutoRiferimento || null,
    iscrittoRunts: dati.iscrittoRunts,
    numeroRunts: dati.numeroRunts || null,
    regimeFiscale: dati.regimeFiscale || null,
    piePaginaRicevute: dati.piePaginaRicevute || null,
    ...(opzioni.segnaConfigurazioneCompletata ? { configurazioneCompletata: true } : {}),
  };

  await prisma.associazione.update({
    where: { id: associazioneEsistente.id },
    data: datiAggiornati,
  });

  await registraAudit({
    utenteId: utente.id,
    entita: "Associazione",
    entitaId: associazioneEsistente.id,
    azione: opzioni.segnaConfigurazioneCompletata ? "configurazione_iniziale" : "aggiornamento",
  });

  revalidatePath("/amministrazione");
  revalidatePath("/dashboard");
  return { successo: true };
}
