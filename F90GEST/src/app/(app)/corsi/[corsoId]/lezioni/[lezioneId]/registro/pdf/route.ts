import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { richiediUtente } from "@/lib/auth/richiedi-utente";
import { prisma } from "@/lib/prisma";
import { RegistroPresenzeDocument } from "@/lib/presenza/registro-pdf";
import { ETICHETTE_STATI_PRESENZA } from "@/lib/validazioni/corso";

// PDF del registro presenze rigenerato al volo ad ogni richiesta (non è un
// documento append-only-critico come la ricevuta: riflette semplicemente lo
// stato corrente delle presenze registrate per la lezione).
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ corsoId: string; lezioneId: string }> }
) {
  await richiediUtente();
  const { corsoId, lezioneId } = await params;

  const lezione = await prisma.lezione.findUnique({
    where: { id: lezioneId },
    include: { corso: true },
  });
  if (!lezione || lezione.corsoId !== corsoId) {
    return NextResponse.json({ errore: "Lezione non trovata." }, { status: 404 });
  }

  const [iscrizioni, presenze, associazione] = await Promise.all([
    prisma.iscrizioneCorso.findMany({
      where: { corsoId, stato: { in: ["confermato", "preiscritto"] }, deletedAt: null },
      include: { persona: true },
      orderBy: [{ persona: { cognome: "asc" } }, { persona: { nome: "asc" } }],
    }),
    prisma.presenza.findMany({ where: { lezioneId } }),
    prisma.associazione.findFirst(),
  ]);
  const presenzaPerIscrizione = new Map(presenze.map((p) => [p.iscrizioneId, p]));

  const buffer = await renderToBuffer(
    RegistroPresenzeDocument({
      denominazioneEnte: associazione?.denominazione ?? "Associazione",
      corsoTitolo: lezione.corso.titolo,
      numeroProgressivo: lezione.numeroProgressivo,
      data: new Intl.DateTimeFormat("it-IT").format(lezione.data),
      orario: `${lezione.oraInizio}–${lezione.oraFine}`,
      righe: iscrizioni.map((iscrizione) => {
        const presenza = presenzaPerIscrizione.get(iscrizione.id);
        return {
          nomeCognome: `${iscrizione.persona.cognome} ${iscrizione.persona.nome}`,
          stato: presenza ? ETICHETTE_STATI_PRESENZA[presenza.stato as keyof typeof ETICHETTE_STATI_PRESENZA] ?? presenza.stato : null,
          oraIngresso: presenza?.oraIngresso ?? null,
        };
      }),
      dataGenerazione: new Intl.DateTimeFormat("it-IT", { dateStyle: "short", timeStyle: "short" }).format(
        new Date()
      ),
    })
  );

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="registro-lezione-${lezione.numeroProgressivo}.pdf"`,
    },
  });
}
