import "server-only";
import type { Prisma } from "@prisma/client";
import { renderToBuffer } from "@react-pdf/renderer";
import { prisma } from "@/lib/prisma";
import { prossimoNumero } from "@/lib/numeratore";
import { calcolaBollo } from "@/lib/contabilita/bollo";
import { ottieniParametriContabilita } from "@/lib/parametri";
import { salvaAllegato } from "@/lib/storage";
import { RicevutaDocument } from "./ricevuta-pdf";

/**
 * Crea la riga Ricevuta dentro la transazione del chiamante (numerazione
 * progressiva per anno solare senza buchi, via Numeratore — §7.4). Il PDF
 * NON viene generato qui: è un side effect su filesystem che va fatto dopo
 * che la transazione DB è commit-ata con successo (vedi
 * `generaEAllegaPdfRicevuta`), altrimenti un rollback lascerebbe un file
 * orfano su disco. La numerazione e la scrittura contabile restano
 * comunque atomiche, che è l'invariante richiesta dalla specifica (§8).
 */
export async function creaRicevutaInTransazione(
  tx: Prisma.TransactionClient,
  dati: {
    intestatarioId: string;
    causale: string;
    importo: number;
    naturaFiscale: string;
    data: Date;
    pagamentoId?: string;
    createdById: string;
  },
  parametri: Awaited<ReturnType<typeof ottieniParametriContabilita>>
) {
  const annoSolare = dati.data.getFullYear();
  const numero = await prossimoNumero(tx, "ricevuta", annoSolare);

  const bollo = calcolaBollo({
    importo: dati.importo,
    naturaFiscale: dati.naturaFiscale,
    sogliaBolloEuro: parametri.sogliaBolloEuro,
    importoBolloEuro: parametri.importoBolloEuro,
    natureFiscaliSoggetteABollo: parametri.natureFiscaliSoggetteABollo,
  });

  const associazione = await tx.associazione.findFirst();

  return tx.ricevuta.create({
    data: {
      numero,
      annoSolare,
      data: dati.data,
      intestatarioId: dati.intestatarioId,
      causale: dati.causale,
      importo: dati.importo,
      naturaFiscale: dati.naturaFiscale,
      bolloApplicato: bollo.applicato,
      importoBollo: bollo.importo,
      testoNormativoPiede: associazione?.piePaginaRicevute ?? null,
      pagamentoId: dati.pagamentoId,
      createdById: dati.createdById,
    },
  });
}

/**
 * Genera il PDF della ricevuta e lo allega (Allegato + storage su disco),
 * poi collega `pdfAllegatoId`. Da chiamare subito dopo che la transazione
 * che ha creato la ricevuta è andata a buon fine.
 */
export async function generaEAllegaPdfRicevuta(ricevutaId: string): Promise<void> {
  const ricevuta = await prisma.ricevuta.findUniqueOrThrow({
    where: { id: ricevutaId },
    include: { intestatario: true },
  });
  const associazione = await prisma.associazione.findFirst();

  const buffer = await renderToBuffer(
    RicevutaDocument({
      denominazioneEnte: associazione?.denominazione ?? "Associazione",
      codiceFiscaleEnte: associazione?.codiceFiscale ?? "",
      sedeEnte: [associazione?.sedeLegaleVia, associazione?.sedeLegaleComune].filter(Boolean).join(", "),
      numero: ricevuta.numero,
      annoSolare: ricevuta.annoSolare,
      data: new Intl.DateTimeFormat("it-IT").format(ricevuta.data),
      intestatarioNome: `${ricevuta.intestatario.cognome} ${ricevuta.intestatario.nome}`,
      intestatarioCodiceFiscale: ricevuta.intestatario.codiceFiscale,
      causale: ricevuta.causale,
      importo: Number(ricevuta.importo).toFixed(2),
      bolloApplicato: ricevuta.bolloApplicato,
      importoBollo: ricevuta.importoBollo ? Number(ricevuta.importoBollo).toFixed(2) : null,
      testoNormativoPiede: ricevuta.testoNormativoPiede,
      stato: ricevuta.stato,
      dataGenerazione: new Intl.DateTimeFormat("it-IT", { dateStyle: "short", timeStyle: "short" }).format(
        new Date()
      ),
    })
  );

  const allegato = await salvaAllegato({
    entitaTipo: "Ricevuta",
    entitaId: ricevuta.id,
    nomeFileOriginale: `ricevuta-${ricevuta.numero}-${ricevuta.annoSolare}.pdf`,
    mimeType: "application/pdf",
    buffer,
    createdById: ricevuta.createdById,
  });

  await prisma.ricevuta.update({ where: { id: ricevuta.id }, data: { pdfAllegatoId: allegato.id } });
}
