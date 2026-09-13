import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// Pagina pubblica senza autenticazione (proxy.ts non tocca cookie/headers
// qui): va sempre resa dinamicamente, sia perché l'elenco dei corsi aperti
// cambia nel tempo sia perché altrimenti Next proverebbe a pre-renderla in
// fase di build, prima che il database esista.
export const dynamic = "force-dynamic";

export default async function IscrizionePubblicaPage() {
  const [associazione, corsi] = await Promise.all([
    prisma.associazione.findFirst(),
    prisma.corso.findMany({
      where: { deletedAt: null, stato: "aperto_iscrizioni" },
      orderBy: { dataInizio: "asc" },
    }),
  ]);

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6 px-4 py-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Iscrizione ai corsi — {associazione?.denominazione ?? "Associazione"}
        </h1>
        <p className="text-sm text-muted-foreground">
          Scegli il corso a cui vuoi iscriverti. La segreteria verificherà la richiesta e ti ricontatterà per
          confermarla.
        </p>
      </div>

      {corsi.length === 0 && (
        <Card>
          <CardContent className="pt-6 text-sm text-muted-foreground">
            Al momento non ci sono corsi aperti alle iscrizioni online. Contatta la segreteria per informazioni.
          </CardContent>
        </Card>
      )}

      {corsi.map((corso) => (
        <Card key={corso.id}>
          <CardContent className="flex flex-wrap items-center justify-between gap-4 pt-6">
            <div>
              <p className="font-medium">
                {corso.titolo}
                {corso.edizione ? ` — ${corso.edizione}` : ""}
              </p>
              <p className="text-sm text-muted-foreground">
                {corso.sede ? `${corso.sede} · ` : ""}
                Inizio {new Intl.DateTimeFormat("it-IT").format(corso.dataInizio)}
              </p>
            </div>
            <Button asChild>
              <Link href={`/iscrizione/${corso.id}`}>Iscriviti</Link>
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
