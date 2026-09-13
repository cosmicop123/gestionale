"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { richiediRuolo } from "@/lib/auth/richiedi-utente";
import { registraAudit } from "@/lib/audit";
import { ottieniParametriContabilita } from "@/lib/parametri";
import { calcolaStatoQuota } from "@/lib/contabilita/stato-quota";
import { CATEGORIA_RENDICONTO_DA_NATURA_FISCALE } from "@/lib/validazioni/contabilita";
import { creaRicevutaInTransazione, generaEAllegaPdfRicevuta } from "@/lib/ricevuta/genera";
import { schemaPagamento, type DatiPagamento } from "@/lib/validazioni/contabilita";

export type EsitoPagamento = { errore: string } | { successo: true; ricevutaId: string };

/**
 * Incassa una quota: pagamento + movimento di prima nota + ricevuta in
 * un'unica transazione (§8, mai un doppio inserimento manuale). Se il
 * pagamento porta la quota a "pagata" e il socio risultava "in_attesa",
 * lo fa passare ad "attivo" (nuova riga SocioStato append-only) — questa è
 * la transizione descritta dal flusso domanda → delibera → iscrizione →
 * PAGAMENTO QUOTA → tessera (§6 M2, implementata qui come previsto).
 */
export async function registraPagamentoQuota(
  quotaId: string,
  datiGrezzi: DatiPagamento
): Promise<EsitoPagamento> {
  const utente = await richiediRuolo(["amministratore", "tesoriere"]);

  const risultato = schemaPagamento.safeParse(datiGrezzi);
  if (!risultato.success) {
    return { errore: risultato.error.issues[0]?.message ?? "Dati non validi." };
  }
  const dati = risultato.data;
  const importo = Number(dati.importo);

  const quota = await prisma.quota.findUnique({
    where: { id: quotaId },
    include: { persona: true, tipoQuota: true, pagamenti: true },
  });
  if (!quota || quota.deletedAt) return { errore: "Quota non trovata." };
  if (quota.stato === "stornata") return { errore: "Questa quota è stata stornata." };
  if (quota.stato === "esente") return { errore: "Questa quota è segnata come esente." };
  if (quota.stato === "pagata") return { errore: "Questa quota risulta già interamente pagata." };

  const totalePagatoFinora = quota.pagamenti.reduce((somma, p) => somma + Number(p.importo), 0);
  const nuovoTotale = totalePagatoFinora + importo;
  if (nuovoTotale > Number(quota.importo) + 0.01) {
    return { errore: "L'importo supera il residuo dovuto per questa quota." };
  }

  const parametri = await ottieniParametriContabilita();
  const dataPagamento = new Date(dati.data);

  const { ricevutaId, pagamentoId } = await prisma.$transaction(async (tx) => {
    const pagamento = await tx.pagamento.create({
      data: {
        quotaId: quota.id,
        controparteId: quota.personaId,
        importo,
        data: dataPagamento,
        metodo: dati.metodo,
        contoId: dati.contoId,
        note: dati.note || null,
        createdById: utente.id,
      },
    });

    const categoriaRendiconto = CATEGORIA_RENDICONTO_DA_NATURA_FISCALE[quota.naturaFiscale] ?? "altre_entrate";
    await tx.movimentoPrimaNota.create({
      data: {
        data: dataPagamento,
        tipo: "entrata",
        importo,
        contoId: dati.contoId,
        causale: `Quota ${quota.tipoQuota.descrizione} — ${quota.persona.cognome} ${quota.persona.nome}`,
        categoriaRendiconto,
        controparteId: quota.personaId,
        pagamentoId: pagamento.id,
        ricavoCommerciale: quota.naturaFiscale === "attivita_commerciale",
        createdById: utente.id,
      },
    });

    const ricevuta = await creaRicevutaInTransazione(
      tx,
      {
        intestatarioId: quota.personaId,
        causale: `${quota.tipoQuota.descrizione} — anno sociale`,
        importo,
        naturaFiscale: quota.naturaFiscale,
        data: dataPagamento,
        pagamentoId: pagamento.id,
        createdById: utente.id,
      },
      parametri
    );

    const nuovoStato = calcolaStatoQuota(Number(quota.importo), nuovoTotale);
    await tx.quota.update({ where: { id: quota.id }, data: { stato: nuovoStato } });

    if (nuovoStato === "pagata") {
      const socio = await tx.socio.findUnique({
        where: { personaId: quota.personaId },
        include: { storicoStati: { orderBy: { dataInizio: "desc" }, take: 1 } },
      });
      if (socio && socio.storicoStati[0]?.stato === "in_attesa") {
        await tx.socioStato.create({
          data: {
            socioId: socio.id,
            stato: "attivo",
            dataInizio: dataPagamento,
            estremiDelibera: "Attivazione automatica al pagamento della quota",
            createdById: utente.id,
          },
        });
      }
    }

    return { ricevutaId: ricevuta.id, pagamentoId: pagamento.id };
  });

  await generaEAllegaPdfRicevuta(ricevutaId);

  await registraAudit({
    utenteId: utente.id,
    entita: "Pagamento",
    entitaId: pagamentoId,
    azione: "incasso_quota",
    diff: { quotaId, importo },
  });

  revalidatePath(`/soci/${quota.personaId}`);
  revalidatePath("/contabilita");
  return { successo: true, ricevutaId };
}
