import { notFound } from "next/navigation";
import { richiediRuolo } from "@/lib/auth/richiedi-utente";
import { prisma } from "@/lib/prisma";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EventoIntestazione } from "@/components/evento/evento-intestazione";
import { TabDettagliEvento } from "@/components/evento/tab-dettagli-evento";
import { TabPartecipazioni } from "@/components/evento/tab-partecipazioni";
import { TabTurniVolontari } from "@/components/evento/tab-turni-volontari";
import { TabSiae } from "@/components/evento/tab-siae";
import { TabSponsorEvento } from "@/components/evento/tab-sponsor-evento";

export default async function DettaglioEventoPage({
  params,
}: {
  params: Promise<{ eventoId: string }>;
}) {
  const utente = await richiediRuolo(["amministratore", "segreteria", "tesoriere", "sola_lettura"]);
  const { eventoId } = await params;

  const evento = await prisma.evento.findUnique({
    where: { id: eventoId, deletedAt: null },
    include: {
      partecipazioni: { include: { persona: true }, orderBy: { createdAt: "asc" } },
      turniVolontari: { include: { volontario: true }, orderBy: { createdAt: "asc" } },
      praticaSiae: { include: { programmaMusicale: { include: { brano: true }, orderBy: { ordineEsecuzione: "asc" } } } },
      sponsorizzazioni: { include: { soggetto: true }, orderBy: { createdAt: "desc" } },
    },
  });
  if (!evento) notFound();

  const puoGestire = utente.ruolo === "amministratore" || utente.ruolo === "segreteria";
  const puoIncassare = puoGestire || utente.ruolo === "tesoriere";

  const [persone, conti, archivioBrani] = await Promise.all([
    prisma.persona.findMany({
      where: { deletedAt: null },
      select: { id: true, nome: true, cognome: true },
      orderBy: [{ cognome: "asc" }, { nome: "asc" }],
    }),
    prisma.conto.findMany({ where: { deletedAt: null }, orderBy: { nome: "asc" } }),
    prisma.branoMusicale.findMany({ where: { deletedAt: null }, orderBy: { titolo: "asc" } }),
  ]);

  return (
    <div className="space-y-6">
      <EventoIntestazione evento={evento} puoGestire={puoGestire} />

      <Tabs defaultValue="partecipazioni">
        <TabsList>
          <TabsTrigger value="dettagli">Dettagli</TabsTrigger>
          <TabsTrigger value="partecipazioni">Partecipazioni</TabsTrigger>
          <TabsTrigger value="turni">Turni volontari</TabsTrigger>
          <TabsTrigger value="siae">SIAE</TabsTrigger>
          <TabsTrigger value="sponsor">Sponsor</TabsTrigger>
        </TabsList>
        <TabsContent value="dettagli">
          <TabDettagliEvento evento={evento} puoGestire={puoGestire} />
        </TabsContent>
        <TabsContent value="partecipazioni">
          <TabPartecipazioni
            evento={evento}
            partecipazioni={evento.partecipazioni}
            persone={persone}
            conti={conti}
            puoGestire={puoGestire}
            puoIncassare={puoIncassare}
          />
        </TabsContent>
        <TabsContent value="turni">
          <TabTurniVolontari
            eventoId={evento.id}
            turni={evento.turniVolontari}
            persone={persone}
            puoGestire={puoGestire}
          />
        </TabsContent>
        <TabsContent value="siae">
          <TabSiae
            eventoId={evento.id}
            pratica={evento.praticaSiae}
            archivioBrani={archivioBrani}
            puoGestire={puoGestire}
          />
        </TabsContent>
        <TabsContent value="sponsor">
          <TabSponsorEvento
            eventoId={evento.id}
            sponsorizzazioni={evento.sponsorizzazioni}
            persone={persone}
            conti={conti}
            puoGestire={puoGestire}
            puoIncassare={puoIncassare}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
