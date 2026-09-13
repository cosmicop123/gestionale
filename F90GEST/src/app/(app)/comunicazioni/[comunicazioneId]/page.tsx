import { notFound } from "next/navigation";
import { richiediRuolo } from "@/lib/auth/richiedi-utente";
import { prisma } from "@/lib/prisma";
import { ComunicazioneDettaglio } from "@/components/comunicazione/comunicazione-dettaglio";

export default async function ComunicazioneDettaglioPage({
  params,
}: {
  params: Promise<{ comunicazioneId: string }>;
}) {
  await richiediRuolo(["amministratore", "segreteria"]);
  const { comunicazioneId } = await params;

  const comunicazione = await prisma.comunicazione.findUnique({
    where: { id: comunicazioneId },
    include: { invii: { include: { persona: true }, orderBy: { createdAt: "asc" } } },
  });
  if (!comunicazione || comunicazione.deletedAt) notFound();

  return <ComunicazioneDettaglio comunicazione={comunicazione} />;
}
