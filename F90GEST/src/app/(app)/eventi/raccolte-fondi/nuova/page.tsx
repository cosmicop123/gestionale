import { richiediRuolo } from "@/lib/auth/richiedi-utente";
import { prisma } from "@/lib/prisma";
import { RaccoltaFondiForm } from "@/components/evento/raccolta-fondi-form";

export default async function NuovaRaccoltaFondiPage() {
  await richiediRuolo(["amministratore", "segreteria"]);

  const eventi = await prisma.evento.findMany({
    where: { deletedAt: null },
    select: { id: true, titolo: true },
    orderBy: { dataInizio: "desc" },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Nuova raccolta fondi</h1>
      <RaccoltaFondiForm eventi={eventi} />
    </div>
  );
}
