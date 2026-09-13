import { NextResponse } from "next/server";
import { richiediUtente } from "@/lib/auth/richiedi-utente";
import { leggiAllegato } from "@/lib/storage";

// Download generico di un allegato (es. giustificativo di un'uscita di
// prima nota): servito solo ad utenti autenticati (§8).
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ allegatoId: string }> }
) {
  await richiediUtente();
  const { allegatoId } = await params;

  const allegato = await leggiAllegato(allegatoId);
  if (!allegato) {
    return NextResponse.json({ errore: "File non trovato." }, { status: 404 });
  }

  return new NextResponse(new Uint8Array(allegato.buffer), {
    headers: {
      "Content-Type": allegato.mimeType,
      "Content-Disposition": `inline; filename="${allegato.nomeFileOriginale}"`,
    },
  });
}
