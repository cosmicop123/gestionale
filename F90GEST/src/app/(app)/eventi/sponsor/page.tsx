import Link from "next/link";
import { richiediRuolo } from "@/lib/auth/richiedi-utente";
import { prisma } from "@/lib/prisma";
import { TabSponsorGlobale } from "@/components/evento/tab-sponsor-globale";

export default async function SponsorPage() {
  const utente = await richiediRuolo(["amministratore", "segreteria", "tesoriere", "sola_lettura"]);
  const puoGestire = utente.ruolo === "amministratore" || utente.ruolo === "segreteria";
  const puoIncassare = puoGestire || utente.ruolo === "tesoriere";

  const [sponsorizzazioni, persone, conti] = await Promise.all([
    prisma.sponsorContributo.findMany({
      where: { deletedAt: null },
      include: { soggetto: true, evento: true, raccoltaFondi: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.persona.findMany({
      where: { deletedAt: null },
      select: { id: true, nome: true, cognome: true },
      orderBy: [{ cognome: "asc" }, { nome: "asc" }],
    }),
    prisma.conto.findMany({ where: { deletedAt: null }, orderBy: { nome: "asc" } }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Sponsor e contributi</h1>
          <p className="text-sm text-muted-foreground">
            Sponsorizzazioni, erogazioni liberali e contributi pubblici, collegati o meno a un evento.
          </p>
        </div>
        <Link href="/eventi" className="text-sm text-muted-foreground hover:underline">
          ← Torna agli eventi
        </Link>
      </div>

      <TabSponsorGlobale
        sponsorizzazioni={sponsorizzazioni}
        persone={persone}
        conti={conti}
        puoGestire={puoGestire}
        puoIncassare={puoIncassare}
      />
    </div>
  );
}
