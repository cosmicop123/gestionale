import { NextResponse } from "next/server";
import { richiediUtente } from "@/lib/auth/richiedi-utente";
import { prisma } from "@/lib/prisma";
import { leggiAllegato } from "@/lib/storage";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ attestatoId: string }> }
) {
  await richiediUtente();
  const { attestatoId } = await params;

  const attestato = await prisma.attestato.findUnique({ where: { id: attestatoId } });
  if (!attestato || !attestato.pdfAllegatoId) {
    return NextResponse.json({ errore: "Attestato o PDF non trovato." }, { status: 404 });
  }

  const allegato = await leggiAllegato(attestato.pdfAllegatoId);
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
