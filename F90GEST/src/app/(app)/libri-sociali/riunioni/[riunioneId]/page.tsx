import { notFound } from "next/navigation";
import { richiediRuolo } from "@/lib/auth/richiedi-utente";
import { prisma } from "@/lib/prisma";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RiunioneIntestazione } from "@/components/riunione/riunione-intestazione";
import { TabPartecipantiRiunione } from "@/components/riunione/tab-partecipanti-riunione";
import { TabDelibere } from "@/components/riunione/tab-delibere";
import { TabVerbale } from "@/components/riunione/tab-verbale";

export default async function DettaglioRiunionePage({
  params,
}: {
  params: Promise<{ riunioneId: string }>;
}) {
  const utente = await richiediRuolo(["amministratore", "segreteria", "tesoriere", "sola_lettura"]);
  const { riunioneId } = await params;
  const puoGestire = utente.ruolo === "amministratore" || utente.ruolo === "segreteria";

  const riunione = await prisma.riunione.findUnique({
    where: { id: riunioneId, deletedAt: null },
    include: {
      partecipanti: { include: { persona: true, delegatoDa: true }, orderBy: { persona: { cognome: "asc" } } },
      delibere: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!riunione) notFound();

  const persone = puoGestire
    ? await prisma.persona.findMany({
        where: { deletedAt: null },
        select: { id: true, nome: true, cognome: true },
        orderBy: [{ cognome: "asc" }, { nome: "asc" }],
      })
    : [];

  return (
    <div className="space-y-6">
      <RiunioneIntestazione riunione={riunione} puoGestire={puoGestire} />

      <Tabs defaultValue="partecipanti">
        <TabsList>
          <TabsTrigger value="partecipanti">Partecipanti</TabsTrigger>
          <TabsTrigger value="delibere">Delibere</TabsTrigger>
          <TabsTrigger value="verbale">Verbale</TabsTrigger>
        </TabsList>
        <TabsContent value="partecipanti">
          <TabPartecipantiRiunione
            riunioneId={riunione.id}
            partecipanti={riunione.partecipanti}
            persone={persone}
            puoGestire={puoGestire}
          />
        </TabsContent>
        <TabsContent value="delibere">
          <TabDelibere riunioneId={riunione.id} delibere={riunione.delibere} puoGestire={puoGestire} />
        </TabsContent>
        <TabsContent value="verbale">
          <TabVerbale riunioneId={riunione.id} verbaleTesto={riunione.verbaleTesto} puoGestire={puoGestire} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
