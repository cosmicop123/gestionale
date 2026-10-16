"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { richiediRuolo } from "@/lib/auth/richiedi-utente";
import { registraAudit } from "@/lib/audit";
import { eliminaAllegato } from "@/lib/storage";

const FRASE_CONFERMA_AZZERAMENTO_QUOTE = "ELIMINA";

/**
 * Azzera quote e ricevute lasciando intatta l'anagrafica soci (Persona,
 * Socio, SocioStato, DomandaAmmissione, Tesseramento), per il caso d'uso
 * esplicito "ho sbagliato tutte le quote e le ricevute ma voglio tenere i
 * soci già registrati" — diverso dall'azzeramento completo (che ricrea
 * tutto da zero) e dalla correzione numerazione (che annulla senza
 * cancellare, per le ricevute già realmente emesse a terzi).
 *
 * Qui invece è una **cancellazione reale**, non un annullamento: a
 * differenza delle ricevute "corrette ma da rinumerare" della milestone
 * precedente, queste sono ricevute/quote create per errore durante
 * l'impostazione iniziale, mai davvero valide — tenerle "annullate" per
 * sempre nello storico non avrebbe senso. Decisione discussa esplicitamente
 * con l'utente (vedi nota di continuità in CLAUDE.md): non generalizzare
 * questo pattern di cancellazione reale ad altre entità fiscali senza una
 * richiesta altrettanto esplicita.
 *
 * Cosa viene cancellato:
 * - Tutte le Ricevute (e i relativi PDF allegati).
 * - Tutti i Pagamenti collegati a una Quota (non i pagamenti "liberi",
 *   es. erogazioni liberali senza quota collegata — quelli restano).
 * - Tutti i MovimentoPrimaNota generati da quei pagamenti/ricevute (altrimenti
 *   il saldo di cassa resterebbe gonfiato da incassi che, con quota/ricevuta
 *   cancellate, non risultano più collegati a nulla).
 * - Tutte le Quote.
 *
 * Cosa NON viene toccato:
 * - Persona, Socio, SocioStato, DomandaAmmissione, Tesseramento: restano
 *   esattamente come sono. In particolare lo stato socio (es. "attivo") non
 *   viene retrocesso automaticamente a "in attesa": il sistema non ha un
 *   modo affidabile per sapere se quella transizione di stato dipendeva
 *   solo dal pagamento cancellato o da altro, quindi va verificata a mano
 *   dall'amministratore sulla scheda del socio, se necessario.
 * - Pagamenti non collegati a nessuna Quota (es. donazioni libere).
 */
export async function azzeraQuoteERicevute(
  formData: FormData
): Promise<{ errore: string } | { ok: true; messaggio: string }> {
  const utente = await richiediRuolo(["amministratore"]);

  const conferma = String(formData.get("conferma") ?? "");
  if (conferma !== FRASE_CONFERMA_AZZERAMENTO_QUOTE) {
    return { errore: `Digitare esattamente "${FRASE_CONFERMA_AZZERAMENTO_QUOTE}" per confermare.` };
  }

  const ricevute = await prisma.ricevuta.findMany({ select: { id: true, pdfAllegatoId: true } });
  const pagamentiDiQuota = await prisma.pagamento.findMany({
    where: { quotaId: { not: null } },
    select: { id: true },
  });
  const ricevuteIds = ricevute.map((r) => r.id);
  const pagamentiIds = pagamentiDiQuota.map((p) => p.id);

  // Tesseramento.quotaId e MovimentoPrimaNota.pagamentoId/ricevutaId sono
  // ON DELETE SET NULL (verificato nella migration SQL): cancellare Quota
  // più sotto azzera da sé il collegamento della tessera, senza bisogno di
  // toccarla esplicitamente qui — la tessera stessa non viene mai cancellata.
  const [{ count: movimentiEliminati }, { count: ricevuteEliminate }, { count: pagamentiEliminati }, { count: quoteEliminate }] =
    await prisma.$transaction([
      prisma.movimentoPrimaNota.deleteMany({
        where: {
          OR: [{ ricevutaId: { in: ricevuteIds } }, { pagamentoId: { in: pagamentiIds } }],
        },
      }),
      prisma.ricevuta.deleteMany({ where: { id: { in: ricevuteIds } } }),
      prisma.pagamento.deleteMany({ where: { id: { in: pagamentiIds } } }),
      prisma.quota.deleteMany({}),
    ]);

  for (const ricevuta of ricevute) {
    if (ricevuta.pdfAllegatoId) {
      await eliminaAllegato(ricevuta.pdfAllegatoId);
    }
  }

  await registraAudit({
    utenteId: utente.id,
    entita: "Quota",
    entitaId: "azzeramento-massivo",
    azione: "azzeramento_quote_ricevute",
    diff: { ricevuteEliminate, pagamentiEliminati, movimentiEliminati, quoteEliminate },
  });

  revalidatePath("/contabilita");
  revalidatePath("/soci");

  return {
    ok: true,
    messaggio: `Eliminate ${quoteEliminate} quote, ${ricevuteEliminate} ricevute, ${pagamentiEliminati} pagamenti e ${movimentiEliminati} movimenti di prima nota collegati. I soci e il loro stato attuale non sono stati modificati: verifica manualmente se qualche socio deve tornare "in attesa" sulla sua scheda.`,
  };
}
