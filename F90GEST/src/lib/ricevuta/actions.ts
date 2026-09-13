"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { richiediRuolo } from "@/lib/auth/richiedi-utente";
import { registraAudit } from "@/lib/audit";
import { generaEAllegaPdfRicevuta } from "./genera";

export type EsitoRicevuta = { errore: string } | { successo: true };

/**
 * Annulla una ricevuta (§7.4): mai una cancellazione, solo uno stato
 * tracciato con motivo. Il PDF viene rigenerato per mostrare la filigrana
 * "ANNULLATA".
 */
export async function annullaRicevuta(
  ricevutaId: string,
  datiGrezzi: { motivo: string }
): Promise<EsitoRicevuta> {
  const utente = await richiediRuolo(["amministratore", "tesoriere"]);

  if (!datiGrezzi.motivo?.trim()) {
    return { errore: "Inserire il motivo dell'annullamento." };
  }

  const ricevuta = await prisma.ricevuta.findUnique({ where: { id: ricevutaId } });
  if (!ricevuta) return { errore: "Ricevuta non trovata." };
  if (ricevuta.stato === "annullata") return { errore: "Questa ricevuta è già annullata." };

  await prisma.ricevuta.update({
    where: { id: ricevutaId },
    data: { stato: "annullata", motivoAnnullamento: datiGrezzi.motivo },
  });

  await generaEAllegaPdfRicevuta(ricevutaId);

  await registraAudit({
    utenteId: utente.id,
    entita: "Ricevuta",
    entitaId: ricevutaId,
    azione: "annullamento",
    diff: { motivo: datiGrezzi.motivo },
  });

  revalidatePath("/contabilita");
  return { successo: true };
}
