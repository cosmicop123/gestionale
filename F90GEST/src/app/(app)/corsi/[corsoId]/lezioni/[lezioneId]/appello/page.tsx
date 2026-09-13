import { notFound, redirect } from "next/navigation";
import QRCode from "qrcode";
import { richiediRuolo } from "@/lib/auth/richiedi-utente";
import { prisma } from "@/lib/prisma";
import { AppelloClient } from "@/components/corso/appello-client";

export default async function AppelloPage({
  params,
}: {
  params: Promise<{ corsoId: string; lezioneId: string }>;
}) {
  const utente = await richiediRuolo(["amministratore", "segreteria", "docente"]);
  const { corsoId, lezioneId } = await params;

  const lezione = await prisma.lezione.findUnique({
    where: { id: lezioneId },
    include: { corso: true },
  });
  if (!lezione || lezione.corsoId !== corsoId) notFound();

  if (utente.ruolo === "docente") {
    const assegnato = await prisma.corsoDocente.findFirst({
      where: { corsoId, personaId: utente.personaId ?? "" },
    });
    if (!assegnato) redirect("/corsi?errore=permessi");
  }

  const [iscrizioni, presenze] = await Promise.all([
    prisma.iscrizioneCorso.findMany({
      where: { corsoId, stato: { in: ["confermato", "preiscritto"] }, deletedAt: null },
      include: { persona: true },
      orderBy: [{ persona: { cognome: "asc" } }, { persona: { nome: "asc" } }],
    }),
    prisma.presenza.findMany({ where: { lezioneId } }),
  ]);
  const presenzaPerIscrizione = new Map(presenze.map((p) => [p.iscrizioneId, p]));

  const righe = await Promise.all(
    iscrizioni.map(async (iscrizione) => ({
      iscrizioneId: iscrizione.id,
      nomeCognome: `${iscrizione.persona.cognome} ${iscrizione.persona.nome}`,
      stato: presenzaPerIscrizione.get(iscrizione.id)?.stato ?? null,
      qrDataUrl: await QRCode.toDataURL(iscrizione.id, { margin: 1, width: 220 }),
    }))
  );

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">
          Appello — {lezione.corso.titolo} · lezione n. {lezione.numeroProgressivo}
        </h1>
        <p className="text-sm text-muted-foreground">
          {new Intl.DateTimeFormat("it-IT").format(lezione.data)}, ore {lezione.oraInizio}–{lezione.oraFine}
        </p>
      </div>
      <AppelloClient lezioneId={lezioneId} righeIniziali={righe} />
    </div>
  );
}
