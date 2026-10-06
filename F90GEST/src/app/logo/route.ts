import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { leggiAllegato } from "@/lib/storage";

/**
 * Rotta pubblica (nessun richiediUtente): il logo deve essere visibile
 * anche nella pagina di login, che non richiede autenticazione — a
 * differenza della rotta generica /contabilita/allegati/[id], riservata
 * agli utenti autenticati. Nessun dato sensibile qui, solo l'immagine del
 * logo già pubblicata dall'associazione.
 */
export async function GET() {
  const associazione = await prisma.associazione.findFirst({ select: { logoAllegatoId: true } });
  if (!associazione?.logoAllegatoId) {
    return NextResponse.json({ errore: "Nessun logo configurato." }, { status: 404 });
  }

  const allegato = await leggiAllegato(associazione.logoAllegatoId);
  if (!allegato) {
    return NextResponse.json({ errore: "Logo non trovato." }, { status: 404 });
  }

  return new NextResponse(new Uint8Array(allegato.buffer), {
    headers: {
      "Content-Type": allegato.mimeType,
      "Cache-Control": "public, max-age=300",
    },
  });
}
