import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { richiediUtente } from "@/lib/auth/richiedi-utente";
import { prisma } from "@/lib/prisma";
import { VerbaleDocument } from "@/lib/riunione/verbale-pdf";
import { ETICHETTE_TIPI_RIUNIONE, ETICHETTE_ESITI_DELIBERA } from "@/lib/validazioni/riunione";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ riunioneId: string }> }
) {
  await richiediUtente();
  const { riunioneId } = await params;

  const [riunione, associazione] = await Promise.all([
    prisma.riunione.findUnique({
      where: { id: riunioneId },
      include: {
        partecipanti: { include: { persona: true, delegatoDa: true } },
        delibere: { orderBy: { createdAt: "asc" } },
      },
    }),
    prisma.associazione.findFirst(),
  ]);
  if (!riunione) {
    return NextResponse.json({ errore: "Riunione non trovata." }, { status: 404 });
  }

  const buffer = await renderToBuffer(
    VerbaleDocument({
      denominazioneEnte: associazione?.denominazione ?? "Associazione",
      tipoRiunioneEtichetta:
        ETICHETTE_TIPI_RIUNIONE[riunione.tipo as keyof typeof ETICHETTE_TIPI_RIUNIONE] ?? riunione.tipo,
      numeroProgressivo: riunione.numeroProgressivo,
      data: new Intl.DateTimeFormat("it-IT").format(riunione.data),
      ora: riunione.ora,
      sede: riunione.sede,
      ordineDelGiorno: riunione.ordineDelGiorno,
      partecipanti: riunione.partecipanti.map((p) => ({
        nome: `${p.persona.cognome} ${p.persona.nome}`,
        convocato: p.convocato,
        presente: p.presente,
        delegatoDa: p.delegatoDa ? `${p.delegatoDa.cognome} ${p.delegatoDa.nome}` : null,
      })),
      delibere: riunione.delibere.map((d) => ({
        oggetto: d.oggetto,
        esito: ETICHETTE_ESITI_DELIBERA[d.esito as keyof typeof ETICHETTE_ESITI_DELIBERA] ?? d.esito,
        voti:
          d.votiFavorevoli !== null || d.votiContrari !== null || d.votiAstenuti !== null
            ? `favorevoli ${d.votiFavorevoli ?? "—"}, contrari ${d.votiContrari ?? "—"}, astenuti ${d.votiAstenuti ?? "—"}`
            : null,
      })),
      verbaleTesto: riunione.verbaleTesto,
      dataGenerazione: new Intl.DateTimeFormat("it-IT", { dateStyle: "short", timeStyle: "short" }).format(
        new Date()
      ),
    })
  );

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="verbale-${riunione.tipo}-${riunione.numeroProgressivo}.pdf"`,
    },
  });
}
