"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { richiediRuolo } from "@/lib/auth/richiedi-utente";
import { registraAudit } from "@/lib/audit";
import { schemaInformativa, type DatiInformativa } from "@/lib/validazioni/informativa";

export type EsitoInformativa = { errore: string } | { successo: true };

/**
 * Pubblica una nuova versione dell'informativa privacy. Il testo è scritto e
 * incollato dall'associazione (o dal proprio DPO/consulente): il gestionale
 * non genera né propone alcun testo, per non fornire consulenza legale
 * (§12). Le versioni precedenti restano intatte, perché i consensi già
 * raccolti (`Consenso.informativaId`) devono continuare a riferirsi al testo
 * effettivamente mostrato al momento — nessuna riscrittura retroattiva.
 */
export async function pubblicaInformativa(datiGrezzi: DatiInformativa): Promise<EsitoInformativa> {
  const utente = await richiediRuolo(["amministratore"]);

  const risultato = schemaInformativa.safeParse(datiGrezzi);
  if (!risultato.success) {
    return { errore: risultato.error.issues[0]?.message ?? "Dati non validi." };
  }

  const informativa = await prisma.informativa.create({
    data: {
      versione: new Date().toISOString(),
      testo: risultato.data.testo,
      dataPubblicazione: new Date(),
    },
  });

  await registraAudit({
    utenteId: utente.id,
    entita: "Informativa",
    entitaId: informativa.id,
    azione: "pubblicazione",
  });

  revalidatePath("/amministrazione");
  return { successo: true };
}
