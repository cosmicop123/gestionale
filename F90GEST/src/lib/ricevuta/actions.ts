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

const FRASE_CONFERMA_AZZERAMENTO = "AZZERA";

/**
 * Corregge la numerazione delle ricevute quando un'associazione inizia a
 * usare il gestionale dopo aver già emesso ricevute "a mano" nello stesso
 * anno solare: la numerazione automatica (Numeratore) partirebbe da 1 e
 * duplicherebbe numeri già usati fuori dal software.
 *
 * Non cancella le ricevute esistenti (§7.4, mai una cancellazione reale di
 * un documento fiscale: romperebbe la tracciabilità in caso di controllo)
 * — le ANNULLA in blocco, stesso meccanismo già usato per l'annullamento
 * di una singola ricevuta, solo applicato a tutte quelle dell'anno
 * selezionato. Imposta poi il prossimo numero da assegnare.
 */
export async function azzeraNumerazioneRicevute(
  formData: FormData
): Promise<{ errore: string } | { ok: true; messaggio: string }> {
  const utente = await richiediRuolo(["amministratore"]);

  const conferma = String(formData.get("conferma") ?? "");
  if (conferma !== FRASE_CONFERMA_AZZERAMENTO) {
    return { errore: `Digitare esattamente "${FRASE_CONFERMA_AZZERAMENTO}" per confermare.` };
  }

  const annoSolare = Number(formData.get("annoSolare"));
  if (!Number.isInteger(annoSolare) || annoSolare < 2000 || annoSolare > 2100) {
    return { errore: "Anno solare non valido." };
  }
  const prossimoNumero = Number(formData.get("prossimoNumero"));
  if (!Number.isInteger(prossimoNumero) || prossimoNumero < 1) {
    return { errore: "Il prossimo numero deve essere un intero maggiore o uguale a 1." };
  }

  const ricevuteDaAnnullare = await prisma.ricevuta.findMany({
    where: { annoSolare, stato: { not: "annullata" } },
    select: { id: true },
  });

  // Forma a callback (non l'array-form di $transaction): serve una lettura
  // condizionale prima della scrittura sul Numeratore (stesso motivo già
  // documentato in prossimoNumero/CLAUDE.md — l'indice composto
  // (entita, annoRiferimento) non accetta un upsert diretto).
  await prisma.$transaction(async (tx) => {
    await tx.ricevuta.updateMany({
      where: { id: { in: ricevuteDaAnnullare.map((r) => r.id) } },
      data: {
        stato: "annullata",
        motivoAnnullamento:
          "Annullamento massivo per correggere la numerazione: ricevute già emesse fuori dal gestionale prima della sua adozione.",
      },
    });

    const esistente = await tx.numeratore.findFirst({ where: { entita: "ricevuta", annoRiferimento: annoSolare } });
    if (esistente) {
      await tx.numeratore.update({ where: { id: esistente.id }, data: { ultimoNumero: prossimoNumero - 1 } });
    } else {
      await tx.numeratore.create({
        data: { entita: "ricevuta", annoRiferimento: annoSolare, ultimoNumero: prossimoNumero - 1 },
      });
    }
  });

  // Rigenera il PDF (filigrana "ANNULLATA") dopo il commit, fuori
  // transazione: stesso principio di `generaEAllegaPdfRicevuta`, mai un
  // side effect su filesystem dentro una transazione DB.
  for (const r of ricevuteDaAnnullare) {
    await generaEAllegaPdfRicevuta(r.id);
  }

  await registraAudit({
    utenteId: utente.id,
    entita: "Numeratore",
    entitaId: `ricevuta-${annoSolare}`,
    azione: "azzeramento_numerazione_ricevute",
    diff: { annoSolare, prossimoNumero, ricevuteAnnullate: ricevuteDaAnnullare.length },
  });

  revalidatePath("/contabilita");
  return {
    ok: true,
    messaggio: `${ricevuteDaAnnullare.length} ricevute del ${annoSolare} annullate. La prossima ricevuta emessa per il ${annoSolare} avrà il numero ${prossimoNumero}.`,
  };
}
