"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { richiediRuolo } from "@/lib/auth/richiedi-utente";
import { registraAudit } from "@/lib/audit";
import { generaQuotaSingola } from "@/lib/quota/actions";

export type EsitoAzione = { errore: string } | { successo: true };

const RUOLI_GESTIONE_INCASSI = ["amministratore", "segreteria", "tesoriere"];

/**
 * Genera la quota di partecipazione di un'iscrizione a un corso, riusando
 * lo stesso meccanismo Quota → Pagamento → Ricevuta già previsto per le
 * quote associative (§6 M3): un corso o un altro servizio a pagamento non è
 * una quota associativa, ma la tracciabilità (numerazione, ricevuta,
 * movimento di prima nota) deve essere identica (§7.4). Il TipoQuota del
 * corso viene creato una sola volta e riusato per tutti i suoi iscritti,
 * cercandolo tra le quote già collegate a un'altra iscrizione dello stesso
 * corso invece di aggiungere una nuova colonna allo schema.
 */
export async function generaQuotaIscrizioneCorso(iscrizioneId: string): Promise<EsitoAzione> {
  const utente = await richiediRuolo(RUOLI_GESTIONE_INCASSI);

  const iscrizione = await prisma.iscrizioneCorso.findUnique({
    where: { id: iscrizioneId },
    include: { corso: true, quota: true },
  });
  if (!iscrizione || iscrizione.deletedAt) return { errore: "Iscrizione non trovata." };
  if (iscrizione.quota) return { errore: "Questa iscrizione ha già una quota generata." };
  if (!iscrizione.corso.quotaPartecipazione || Number(iscrizione.corso.quotaPartecipazione) <= 0) {
    return { errore: "Questo corso non prevede una quota di partecipazione." };
  }

  const annoSocialeCorrente = await prisma.annoSociale.findFirst({
    where: { chiuso: false },
    orderBy: { dataInizio: "desc" },
  });
  if (!annoSocialeCorrente) return { errore: "Nessun anno sociale aperto." };

  const esito = await prisma.$transaction(async (tx) => {
    let tipoQuota = (
      await tx.quota.findFirst({
        where: { iscrizioneCorso: { corsoId: iscrizione.corsoId }, deletedAt: null },
        include: { tipoQuota: true },
        orderBy: { createdAt: "desc" },
      })
    )?.tipoQuota;

    if (!tipoQuota || tipoQuota.annoSocialeId !== annoSocialeCorrente.id) {
      tipoQuota = await tx.tipoQuota.create({
        data: {
          descrizione: `Iscrizione corso: ${iscrizione.corso.titolo}`,
          importo: iscrizione.corso.quotaPartecipazione!,
          annoSocialeId: annoSocialeCorrente.id,
          naturaFiscale: "corrispettivo_specifico",
          ricorrente: false,
          createdById: utente.id,
        },
      });
    }

    return generaQuotaSingola(
      tx,
      iscrizione.personaId,
      tipoQuota.id,
      iscrizione.corso.dataFine ?? iscrizione.corso.dataInizio,
      utente.id,
      { iscrizioneCorsoId: iscrizioneId }
    );
  });

  if (!esito.ok) {
    return { errore: esito.motivo };
  }

  await registraAudit({
    utenteId: utente.id,
    entita: "Quota",
    entitaId: esito.quotaId,
    azione: "generazione_quota_corso",
  });

  revalidatePath(`/corsi/${iscrizione.corsoId}`);
  return { successo: true };
}
