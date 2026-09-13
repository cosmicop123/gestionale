import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import QRCode from "qrcode";
import { richiediUtente } from "@/lib/auth/richiedi-utente";
import { prisma } from "@/lib/prisma";
import { ETICHETTE_CATEGORIE_SOCIO } from "@/lib/validazioni/socio";
import { TesseraDocument } from "@/lib/tesseramento/tessera-pdf";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ tesseramentoId: string }> }
) {
  await richiediUtente();
  const { tesseramentoId } = await params;

  const tesseramento = await prisma.tesseramento.findUnique({
    where: { id: tesseramentoId },
    include: {
      annoSociale: true,
      socio: { include: { persona: true } },
    },
  });
  if (!tesseramento) {
    return NextResponse.json({ errore: "Tesseramento non trovato." }, { status: 404 });
  }

  const associazione = await prisma.associazione.findFirst();
  const qrDataUrl = await QRCode.toDataURL(tesseramento.qrToken, { margin: 1, width: 200 });

  const buffer = await renderToBuffer(
    TesseraDocument({
      denominazioneEnte: associazione?.denominazione ?? "Associazione",
      nomeCognome: `${tesseramento.socio.persona.cognome} ${tesseramento.socio.persona.nome}`,
      numeroTessera: tesseramento.numeroTessera,
      numeroLibroSoci: tesseramento.socio.numeroLibroSoci,
      categoria:
        ETICHETTE_CATEGORIE_SOCIO[tesseramento.socio.categoria as keyof typeof ETICHETTE_CATEGORIE_SOCIO] ??
        tesseramento.socio.categoria,
      annoSociale: tesseramento.annoSociale.etichetta,
      qrDataUrl,
    })
  );

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="tessera-${tesseramento.numeroTessera.replace("/", "-")}.pdf"`,
    },
  });
}
