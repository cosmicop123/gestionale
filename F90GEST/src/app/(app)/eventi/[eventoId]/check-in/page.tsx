import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { richiediRuolo } from "@/lib/auth/richiedi-utente";
import { prisma } from "@/lib/prisma";
import { CheckInClient } from "@/components/evento/check-in-client";

export default async function CheckInEventoPage({
  params,
}: {
  params: Promise<{ eventoId: string }>;
}) {
  await richiediRuolo(["amministratore", "segreteria", "sola_lettura"]);
  const { eventoId } = await params;

  const evento = await prisma.evento.findUnique({
    where: { id: eventoId, deletedAt: null },
    include: { partecipazioni: { include: { persona: true }, orderBy: { createdAt: "asc" } } },
  });
  if (!evento) notFound();

  const righe = await Promise.all(
    evento.partecipazioni.map(async (p) => ({
      partecipazioneId: p.id,
      nome: p.persona ? `${p.persona.cognome} ${p.persona.nome}` : (p.nomeLibero ?? "Partecipante"),
      dataCheckIn: p.dataCheckIn ? p.dataCheckIn.toISOString() : null,
      qrDataUrl: await QRCode.toDataURL(p.id, { margin: 1, width: 220 }),
    }))
  );

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Check-in — {evento.titolo}</h1>
        <p className="text-sm text-muted-foreground">
          {new Intl.DateTimeFormat("it-IT").format(evento.dataInizio)}
        </p>
      </div>
      <CheckInClient eventoId={eventoId} righeIniziali={righe} />
    </div>
  );
}
