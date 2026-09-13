import { notFound, redirect } from "next/navigation";
import { richiediRuolo } from "@/lib/auth/richiedi-utente";
import { prisma } from "@/lib/prisma";
import { calcolaRiepilogoPresenzeIscrizione } from "@/lib/presenza/riepilogo";
import { haDirittoAttestato } from "@/lib/presenza/calcolo-presenze";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CorsoIntestazione } from "@/components/corso/corso-intestazione";
import { TabDettagli } from "@/components/corso/tab-dettagli";
import { TabDocenti } from "@/components/corso/tab-docenti";
import { TabLezioni } from "@/components/corso/tab-lezioni";
import { TabIscrizioni } from "@/components/corso/tab-iscrizioni";
import { TabAttestati } from "@/components/corso/tab-attestati";

export default async function DettaglioCorsoPage({
  params,
}: {
  params: Promise<{ corsoId: string }>;
}) {
  const utente = await richiediRuolo(["amministratore", "segreteria", "docente", "sola_lettura"]);
  const { corsoId } = await params;

  const corso = await prisma.corso.findUnique({
    where: { id: corsoId, deletedAt: null },
    include: {
      docenti: { include: { persona: true } },
      lezioni: { where: { deletedAt: null }, orderBy: { numeroProgressivo: "asc" }, include: { docenteEffettivo: true } },
      iscrizioni: {
        where: { deletedAt: null },
        include: {
          persona: true,
          attestato: true,
          quota: { include: { pagamenti: { include: { ricevuta: true } } } },
        },
        orderBy: { dataIscrizione: "asc" },
      },
    },
  });
  if (!corso) notFound();

  const puoGestire = utente.ruolo === "amministratore" || utente.ruolo === "segreteria";
  const eDocenteAssegnato = corso.docenti.some((d) => d.personaId === utente.personaId);
  if (utente.ruolo === "docente" && !eDocenteAssegnato) {
    redirect("/corsi?errore=permessi");
  }

  const puoGestireIncassi = puoGestire || utente.ruolo === "tesoriere";

  const [persone, conti] = await Promise.all([
    puoGestire
      ? prisma.persona.findMany({
          where: { deletedAt: null },
          select: { id: true, nome: true, cognome: true },
          orderBy: [{ cognome: "asc" }, { nome: "asc" }],
        })
      : Promise.resolve([]),
    puoGestireIncassi
      ? prisma.conto.findMany({ where: { deletedAt: null }, orderBy: { nome: "asc" } })
      : Promise.resolve([]),
  ]);

  const iscrizioniConRiepilogo = await Promise.all(
    corso.iscrizioni
      .filter((i) => i.stato !== "ritirato")
      .map(async (iscrizione) => {
        const riepilogo = await calcolaRiepilogoPresenzeIscrizione(iscrizione.id);
        return {
          ...iscrizione,
          riepilogo,
          idoneo: haDirittoAttestato(riepilogo.percentualePresenza, Number(corso.percentualeMinimaPresenzaAttestato)),
        };
      })
  );

  return (
    <div className="space-y-6">
      <CorsoIntestazione corso={corso} puoGestire={puoGestire} />

      <Tabs defaultValue="lezioni">
        <TabsList>
          <TabsTrigger value="dettagli">Dettagli</TabsTrigger>
          <TabsTrigger value="docenti">Docenti</TabsTrigger>
          <TabsTrigger value="lezioni">Lezioni</TabsTrigger>
          <TabsTrigger value="iscrizioni">Iscrizioni</TabsTrigger>
          <TabsTrigger value="attestati">Attestati</TabsTrigger>
        </TabsList>
        <TabsContent value="dettagli">
          <TabDettagli corso={corso} puoGestire={puoGestire} />
        </TabsContent>
        <TabsContent value="docenti">
          <TabDocenti corsoId={corso.id} docenti={corso.docenti} persone={persone} puoGestire={puoGestire} />
        </TabsContent>
        <TabsContent value="lezioni">
          <TabLezioni
            corsoId={corso.id}
            lezioni={corso.lezioni}
            docenti={corso.docenti.map((d) => d.persona)}
            puoGestire={puoGestire}
            puoFareAppello={puoGestire || utente.ruolo === "docente"}
          />
        </TabsContent>
        <TabsContent value="iscrizioni">
          <TabIscrizioni
            corsoId={corso.id}
            iscrizioni={corso.iscrizioni}
            persone={persone}
            conti={conti}
            capienzaMassima={corso.capienzaMassima}
            quotaPartecipazione={corso.quotaPartecipazione ? Number(corso.quotaPartecipazione) : null}
            puoGestire={puoGestire}
            puoGestireIncassi={puoGestireIncassi}
          />
        </TabsContent>
        <TabsContent value="attestati">
          <TabAttestati
            corsoId={corso.id}
            iscrizioni={iscrizioniConRiepilogo}
            sogliaMinima={Number(corso.percentualeMinimaPresenzaAttestato)}
            puoGestire={puoGestire}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
