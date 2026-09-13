import { richiediRuolo } from "@/lib/auth/richiedi-utente";
import { prisma } from "@/lib/prisma";
import { ComunicazioneForm } from "@/components/comunicazione/comunicazione-form";

export default async function NuovaComunicazionePage() {
  await richiediRuolo(["amministratore", "segreteria"]);

  const [corsi, persone] = await Promise.all([
    prisma.corso.findMany({ where: { deletedAt: null }, orderBy: { dataInizio: "desc" }, select: { id: true, titolo: true } }),
    prisma.persona.findMany({
      where: { deletedAt: null, email: { not: null } },
      orderBy: [{ cognome: "asc" }, { nome: "asc" }],
      select: { id: true, nome: true, cognome: true, email: true },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Nuova comunicazione</h1>
        <p className="text-sm text-muted-foreground">
          Scegli il segmento di destinatari e scrivi il testo dell&apos;email; potrai usare variabili come{" "}
          <code>{"{{nome}}"}</code>.
        </p>
      </div>
      <ComunicazioneForm corsi={corsi} persone={persone} />
    </div>
  );
}
