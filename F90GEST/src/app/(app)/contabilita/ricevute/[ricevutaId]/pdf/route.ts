import { NextResponse } from "next/server";
import { richiediUtente } from "@/lib/auth/richiedi-utente";
import { prisma } from "@/lib/prisma";
import { leggiAllegato } from "@/lib/storage";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ ricevutaId: string }> }
) {
  await richiediUtente();
  const { ricevutaId } = await params;

  const ricevuta = await prisma.ricevuta.findUnique({ where: { id: ricevutaId } });
  if (!ricevuta || !ricevuta.pdfAllegatoId) {
    return NextResponse.json({ errore: "Ricevuta o PDF non trovato." }, { status: 404 });
  }

  const allegato = await leggiAllegato(ricevuta.pdfAllegatoId);
  if (!allegato) {
    return NextResponse.json({ errore: "File non trovato sul disco." }, { status: 404 });
  }

  return new NextResponse(new Uint8Array(allegato.buffer), {
    headers: {
      "Content-Type": allegato.mimeType,
      "Content-Disposition": `inline; filename="${allegato.nomeFileOriginale}"`,
    },
  });
}
