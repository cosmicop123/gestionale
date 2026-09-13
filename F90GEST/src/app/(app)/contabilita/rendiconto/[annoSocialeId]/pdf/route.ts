import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { richiediUtente } from "@/lib/auth/richiedi-utente";
import { prisma } from "@/lib/prisma";
import { ottieniDatiRendiconto } from "@/lib/rendiconto/dati";
import { RendicontoDocument } from "@/lib/rendiconto/rendiconto-pdf";
import { ETICHETTE_CATEGORIE_RENDICONTO, ETICHETTE_SEZIONI_MODELLO_D } from "@/lib/validazioni/contabilita";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ annoSocialeId: string }> }
) {
  await richiediUtente();
  const { annoSocialeId } = await params;

  const [associazione, dati] = await Promise.all([
    prisma.associazione.findFirst(),
    ottieniDatiRendiconto(annoSocialeId).catch(() => null),
  ]);
  if (!dati) {
    return NextResponse.json({ errore: "Anno sociale non trovato." }, { status: 404 });
  }

  const buffer = await renderToBuffer(
    RendicontoDocument({
      denominazioneEnte: associazione?.denominazione ?? "Associazione",
      annoSocialeEtichetta: dati.annoSociale.etichetta,
      formaAggregata: dati.formaAggregata,
      rendiconto: dati.rendiconto,
      etichetteCategoria: ETICHETTE_CATEGORIE_RENDICONTO,
      etichetteSezione: ETICHETTE_SEZIONI_MODELLO_D,
      saldoInizialeComplessivo: dati.saldoInizialeComplessivo,
      saldoFinaleComplessivo: dati.saldoFinaleComplessivo,
      dataGenerazione: new Intl.DateTimeFormat("it-IT", { dateStyle: "short", timeStyle: "short" }).format(
        new Date()
      ),
    })
  );

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="rendiconto-${dati.annoSociale.etichetta.replace("/", "-")}.pdf"`,
    },
  });
}
