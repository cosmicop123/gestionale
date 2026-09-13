import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { ModuloIscrizionePubblica } from "@/components/iscrizione-pubblica/modulo-iscrizione";

// Vedi la nota in /iscrizione/page.tsx: pagina pubblica, sempre dinamica.
export const dynamic = "force-dynamic";

export default async function IscrizioneCorsoPubblicaPage({
  params,
}: {
  params: Promise<{ corsoId: string }>;
}) {
  const { corsoId } = await params;

  const [corso, informativa] = await Promise.all([
    prisma.corso.findUnique({ where: { id: corsoId, deletedAt: null } }),
    prisma.informativa.findFirst({ orderBy: { dataPubblicazione: "desc" } }),
  ]);

  if (!corso || corso.stato !== "aperto_iscrizioni") notFound();

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6 px-4 py-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Iscrizione — {corso.titolo}
          {corso.edizione ? ` — ${corso.edizione}` : ""}
        </h1>
        {corso.descrizione && <p className="mt-2 text-sm text-muted-foreground">{corso.descrizione}</p>}
        <dl className="mt-4 grid grid-cols-2 gap-2 text-sm">
          {corso.sede && (
            <>
              <dt className="text-muted-foreground">Sede</dt>
              <dd>{corso.sede}</dd>
            </>
          )}
          <dt className="text-muted-foreground">Data di inizio</dt>
          <dd>{new Intl.DateTimeFormat("it-IT").format(corso.dataInizio)}</dd>
          {corso.quotaPartecipazione && (
            <>
              <dt className="text-muted-foreground">Quota di partecipazione</dt>
              <dd>€ {Number(corso.quotaPartecipazione).toFixed(2)}</dd>
            </>
          )}
        </dl>
      </div>

      {informativa ? (
        <ModuloIscrizionePubblica corsoId={corso.id} testoInformativa={informativa.testo} />
      ) : (
        <Card>
          <CardContent className="pt-6 text-sm text-destructive">
            Il modulo di iscrizione online non è ancora attivo: contatta la segreteria dell&apos;associazione.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
