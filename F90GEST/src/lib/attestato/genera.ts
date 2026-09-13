import "server-only";
import type { Prisma } from "@prisma/client";
import { renderToBuffer } from "@react-pdf/renderer";
import { prisma } from "@/lib/prisma";
import { prossimoNumero } from "@/lib/numeratore";
import { salvaAllegato } from "@/lib/storage";
import { AttestatoDocument } from "./attestato-pdf";

/**
 * Crea la riga Attestato dentro la transazione del chiamante (numerazione
 * progressiva mai riassegnata, come il libro soci — §7.1, §7.4). Come per le
 * ricevute, il PDF viene generato e allegato solo dopo il commit della
 * transazione (vedi `generaEAllegaPdfAttestato`), per non tenere una
 * scrittura su disco dentro la transazione DB.
 */
export async function creaAttestatoInTransazione(
  tx: Prisma.TransactionClient,
  dati: {
    iscrizioneId: string;
    oreFrequentate: number;
    percentualePresenza: number;
    dataEmissione: Date;
    createdById: string;
  }
) {
  const numeroProgressivo = await prossimoNumero(tx, "attestato");

  return tx.attestato.create({
    data: {
      iscrizioneId: dati.iscrizioneId,
      numeroProgressivo,
      oreFrequentate: dati.oreFrequentate,
      percentualePresenza: dati.percentualePresenza,
      dataEmissione: dati.dataEmissione,
      createdById: dati.createdById,
    },
  });
}

export async function generaEAllegaPdfAttestato(attestatoId: string): Promise<void> {
  const attestato = await prisma.attestato.findUniqueOrThrow({
    where: { id: attestatoId },
    include: { iscrizione: { include: { persona: true, corso: true } } },
  });
  const associazione = await prisma.associazione.findFirst();

  const buffer = await renderToBuffer(
    AttestatoDocument({
      denominazioneEnte: associazione?.denominazione ?? "Associazione",
      codiceFiscaleEnte: associazione?.codiceFiscale ?? "",
      sedeEnte: [associazione?.sedeLegaleVia, associazione?.sedeLegaleComune].filter(Boolean).join(", "),
      numero: attestato.numeroProgressivo,
      personaNome: `${attestato.iscrizione.persona.cognome} ${attestato.iscrizione.persona.nome}`,
      corsoTitolo: attestato.iscrizione.corso.titolo,
      corsoEdizione: attestato.iscrizione.corso.edizione,
      oreFrequentate: Number(attestato.oreFrequentate).toFixed(1),
      percentualePresenza: Number(attestato.percentualePresenza).toFixed(0),
      dataEmissione: new Intl.DateTimeFormat("it-IT").format(attestato.dataEmissione),
      dataGenerazione: new Intl.DateTimeFormat("it-IT", { dateStyle: "short", timeStyle: "short" }).format(
        new Date()
      ),
    })
  );

  const allegato = await salvaAllegato({
    entitaTipo: "Attestato",
    entitaId: attestato.id,
    nomeFileOriginale: `attestato-${attestato.numeroProgressivo}.pdf`,
    mimeType: "application/pdf",
    buffer,
    createdById: attestato.createdById,
  });

  await prisma.attestato.update({ where: { id: attestato.id }, data: { pdfAllegatoId: allegato.id } });
}
