import Link from "next/link";
import { notFound } from "next/navigation";
import { Pencil } from "lucide-react";
import { richiediRuolo } from "@/lib/auth/richiedi-utente";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { badgeStatoPersona } from "@/lib/socio/stato-persona";
import { ETICHETTE_CATEGORIE_SOCIO } from "@/lib/validazioni/socio";
import {
  NuovaDomandaAmmissione,
  DomandaInValutazioneCard,
} from "@/components/socio/domanda-ammissione-section";
import { TesseramentoSection } from "@/components/socio/tesseramento-section";
import { QuoteSection } from "@/components/socio/quote-section";

function formattaData(data: Date | null): string {
  return data ? new Intl.DateTimeFormat("it-IT").format(data) : "—";
}

export default async function SchedaSocioPage({
  params,
}: {
  params: Promise<{ personaId: string }>;
}) {
  await richiediRuolo(["amministratore", "segreteria", "tesoriere", "sola_lettura"]);
  const { personaId } = await params;

  const persona = await prisma.persona.findUnique({
    where: { id: personaId, deletedAt: null },
    include: {
      relazioniComeMinore: { where: { deletedAt: null } },
      domandeAmmissione: { orderBy: { createdAt: "desc" }, where: { deletedAt: null } },
      socio: {
        include: {
          storicoStati: { orderBy: { dataInizio: "desc" } },
          tesseramenti: { include: { annoSociale: true }, orderBy: { createdAt: "desc" } },
        },
      },
    },
  });

  if (!persona) notFound();

  const domandaInValutazione = persona.domandeAmmissione.find((d) => d.stato === "in_valutazione");
  const badge = badgeStatoPersona(persona);
  const guardianAttivo = persona.relazioniComeMinore[0];

  const anniSociali = persona.socio
    ? await prisma.annoSociale.findMany({
        where: {
          chiuso: false,
          tesseramenti: { none: { socioId: persona.socio.id } },
        },
        orderBy: { dataInizio: "desc" },
      })
    : [];

  const annoSocialeCorrente = await prisma.annoSociale.findFirst({
    where: { chiuso: false },
    orderBy: { dataInizio: "desc" },
  });
  const [quote, tipiQuota, conti] = await Promise.all([
    prisma.quota.findMany({
      where: { personaId: persona.id, deletedAt: null },
      include: { tipoQuota: true, pagamenti: { include: { ricevuta: true } } },
      orderBy: { createdAt: "desc" },
    }),
    annoSocialeCorrente
      ? prisma.tipoQuota.findMany({ where: { annoSocialeId: annoSocialeCorrente.id, deletedAt: null } })
      : Promise.resolve([]),
    prisma.conto.findMany({ where: { deletedAt: null } }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {persona.cognome} {persona.nome}
          </h1>
          <div className="mt-1 flex items-center gap-2">
            <Badge variant={badge.variante}>{badge.etichetta}</Badge>
            {persona.socio && (
              <span className="text-sm text-muted-foreground">
                N. libro soci {persona.socio.numeroLibroSoci} ·{" "}
                {ETICHETTE_CATEGORIE_SOCIO[persona.socio.categoria as keyof typeof ETICHETTE_CATEGORIE_SOCIO] ??
                  persona.socio.categoria}
              </span>
            )}
          </div>
        </div>
        <Button variant="outline" asChild>
          <Link href={`/soci/${persona.id}/modifica`}>
            <Pencil /> Modifica dati
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Dati anagrafici</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <dt className="text-muted-foreground">Codice fiscale</dt>
              <dd>{persona.codiceFiscale ?? "—"}</dd>
              <dt className="text-muted-foreground">Data di nascita</dt>
              <dd>{formattaData(persona.dataNascita)}</dd>
              <dt className="text-muted-foreground">Comune di nascita</dt>
              <dd>
                {persona.comuneNascita ?? "—"} {persona.provinciaNascita ? `(${persona.provinciaNascita})` : ""}
              </dd>
              <dt className="text-muted-foreground">Residenza</dt>
              <dd>
                {persona.residenzaVia ? `${persona.residenzaVia}, ` : ""}
                {persona.residenzaCap ?? ""} {persona.residenzaComune ?? ""}{" "}
                {persona.residenzaProvincia ? `(${persona.residenzaProvincia})` : ""}
                {!persona.residenzaVia && !persona.residenzaComune && "—"}
              </dd>
              <dt className="text-muted-foreground">Email</dt>
              <dd>{persona.email ?? "—"}</dd>
              <dt className="text-muted-foreground">Telefono</dt>
              <dd>{persona.telefono ?? "—"}</dd>
            </dl>

            {guardianAttivo && (
              <>
                <Separator className="my-4" />
                <p className="mb-2 text-xs font-semibold text-muted-foreground">
                  Esercente la responsabilità genitoriale
                </p>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  <dt className="text-muted-foreground">Nome</dt>
                  <dd>{guardianAttivo.genitoreNomeCognome}</dd>
                  <dt className="text-muted-foreground">Grado di parentela</dt>
                  <dd>{guardianAttivo.gradoParentela}</dd>
                  <dt className="text-muted-foreground">Contatti</dt>
                  <dd>{[guardianAttivo.genitoreEmail, guardianAttivo.genitoreTelefono].filter(Boolean).join(" · ") || "—"}</dd>
                </dl>
              </>
            )}
          </CardContent>
        </Card>

        {persona.socio ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Storico stato socio</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                {persona.socio.storicoStati.map((s) => (
                  <li key={s.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                    <span>{s.stato}</span>
                    <span className="text-muted-foreground">
                      dal {formattaData(s.dataInizio)}
                      {s.dataFine ? ` al ${formattaData(s.dataFine)}` : ""}
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ) : domandaInValutazione ? (
          <DomandaInValutazioneCard domanda={domandaInValutazione} />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Ammissione a socio</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-sm text-muted-foreground">
                Questa persona non ha ancora una domanda di ammissione a socio.
              </p>
              <NuovaDomandaAmmissione personaId={persona.id} />
            </CardContent>
          </Card>
        )}
      </div>

      {persona.socio && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tesseramenti</CardTitle>
          </CardHeader>
          <CardContent>
            <TesseramentoSection
              socioId={persona.socio.id}
              anniSocialiDisponibili={anniSociali}
              tesseramenti={persona.socio.tesseramenti}
            />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Quote e pagamenti</CardTitle>
        </CardHeader>
        <CardContent>
          <QuoteSection personaId={persona.id} quote={quote} tipiQuota={tipiQuota} conti={conti} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Prossimamente</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Corsi frequentati (M4), consensi privacy (M5) e comunicazioni ricevute (M9)
          compariranno qui non appena i rispettivi moduli saranno disponibili.
        </CardContent>
      </Card>
    </div>
  );
}
