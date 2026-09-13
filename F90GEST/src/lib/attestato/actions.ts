"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { richiediRuolo } from "@/lib/auth/richiedi-utente";
import { registraAudit } from "@/lib/audit";
import { calcolaRiepilogoPresenzeIscrizione } from "@/lib/presenza/riepilogo";
import { haDirittoAttestato } from "@/lib/presenza/calcolo-presenze";
import { creaAttestatoInTransazione, generaEAllegaPdfAttestato } from "./genera";

export type EsitoGenerazioneMassiva =
  | { errore: string }
  | { successo: true; generati: number; nonIdonei: number };

const RUOLI_GESTIONE_ATTESTATI = ["amministratore", "segreteria"];

/**
 * Genera in blocco gli attestati per un corso: solo per le iscrizioni non
 * ritirate che superano la soglia minima di presenza del corso e che non
 * hanno già un attestato (§6 M4, "generazione massiva attestati solo per chi
 * supera la soglia"). Ogni attestato viene numerato atomicamente in una
 * transazione separata per persona (come per le ricevute), poi il PDF si
 * genera e si allega dopo il commit.
 */
export async function generaAttestatiCorso(corsoId: string): Promise<EsitoGenerazioneMassiva> {
  const utente = await richiediRuolo(RUOLI_GESTIONE_ATTESTATI);

  const corso = await prisma.corso.findUnique({ where: { id: corsoId } });
  if (!corso || corso.deletedAt) return { errore: "Corso non trovato." };

  const iscrizioni = await prisma.iscrizioneCorso.findMany({
    where: { corsoId, stato: { not: "ritirato" }, deletedAt: null, attestato: null },
  });

  const sogliaMinima = Number(corso.percentualeMinimaPresenzaAttestato);
  let generati = 0;
  let nonIdonei = 0;

  for (const iscrizione of iscrizioni) {
    const riepilogo = await calcolaRiepilogoPresenzeIscrizione(iscrizione.id);
    if (!haDirittoAttestato(riepilogo.percentualePresenza, sogliaMinima)) {
      nonIdonei++;
      continue;
    }

    const attestatoId = await prisma.$transaction(async (tx) => {
      const attestato = await creaAttestatoInTransazione(tx, {
        iscrizioneId: iscrizione.id,
        oreFrequentate: riepilogo.oreFrequentate,
        percentualePresenza: riepilogo.percentualePresenza,
        dataEmissione: new Date(),
        createdById: utente.id,
      });
      return attestato.id;
    });

    await generaEAllegaPdfAttestato(attestatoId);
    generati++;
  }

  await registraAudit({
    utenteId: utente.id,
    entita: "Corso",
    entitaId: corsoId,
    azione: "generazione_massiva_attestati",
    diff: { generati, nonIdonei },
  });

  revalidatePath(`/corsi/${corsoId}`);
  return { successo: true, generati, nonIdonei };
}
