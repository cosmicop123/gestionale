import { notFound } from "next/navigation";
import Link from "next/link";
import { richiediRuolo } from "@/lib/auth/richiedi-utente";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DialogMovimentoRaccolta } from "@/components/evento/movimento-raccolta-form";
import { DialogNuovoSponsor } from "@/components/evento/sponsor-dialogs";
import { ETICHETTE_TIPI_SPONSOR, ETICHETTE_STATI_SPONSOR } from "@/lib/validazioni/evento";

function formattaEuro(valore: number): string {
  return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(valore);
}

export default async function DettaglioRaccoltaFondiPage({
  params,
}: {
  params: Promise<{ raccoltaFondiId: string }>;
}) {
  const utente = await richiediRuolo(["amministratore", "segreteria", "tesoriere", "sola_lettura"]);
  const { raccoltaFondiId } = await params;
  const puoGestire = utente.ruolo === "amministratore" || utente.ruolo === "segreteria";
  const puoRegistrareMovimenti = puoGestire || utente.ruolo === "tesoriere";

  const raccolta = await prisma.raccoltaFondi.findUnique({
    where: { id: raccoltaFondiId, deletedAt: null },
    include: {
      evento: true,
      movimenti: { include: { conto: true }, orderBy: { data: "desc" } },
      sponsor: { include: { soggetto: true }, orderBy: { createdAt: "desc" } },
    },
  });
  if (!raccolta) notFound();

  const [persone, conti] = await Promise.all([
    prisma.persona.findMany({
      where: { deletedAt: null },
      select: { id: true, nome: true, cognome: true },
      orderBy: [{ cognome: "asc" }, { nome: "asc" }],
    }),
    prisma.conto.findMany({ where: { deletedAt: null }, orderBy: { nome: "asc" } }),
  ]);

  const saldo = raccolta.movimenti.reduce(
    (s, m) => s + (m.tipo === "entrata" ? Number(m.importo) : -Number(m.importo)),
    0
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{raccolta.denominazione}</h1>
          <p className="text-sm text-muted-foreground">
            {new Intl.DateTimeFormat("it-IT").format(raccolta.periodoInizio)}
            {raccolta.periodoFine ? ` – ${new Intl.DateTimeFormat("it-IT").format(raccolta.periodoFine)}` : ""}
            {raccolta.evento && (
              <>
                {" · "}
                <Link href={`/eventi/${raccolta.evento.id}`} className="hover:underline">
                  {raccolta.evento.titolo}
                </Link>
              </>
            )}
          </p>
        </div>
        <p className="text-xl font-semibold">{formattaEuro(saldo)}</p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Movimenti</CardTitle>
          {puoRegistrareMovimenti && <DialogMovimentoRaccolta raccoltaFondiId={raccolta.id} conti={conti} />}
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Causale</TableHead>
                <TableHead>Conto</TableHead>
                <TableHead className="text-right">Importo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {raccolta.movimenti.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    Nessun movimento registrato.
                  </TableCell>
                </TableRow>
              )}
              {raccolta.movimenti.map((m) => (
                <TableRow key={m.id}>
                  <TableCell>{new Intl.DateTimeFormat("it-IT").format(m.data)}</TableCell>
                  <TableCell>{m.causale}</TableCell>
                  <TableCell className="text-muted-foreground">{m.conto.nome}</TableCell>
                  <TableCell className={`text-right ${m.tipo === "uscita" ? "text-destructive" : ""}`}>
                    {m.tipo === "uscita" ? "-" : ""}
                    {formattaEuro(Number(m.importo))}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Sponsor e contributi collegati</CardTitle>
          {puoGestire && (
            <DialogNuovoSponsor
              persone={persone}
              raccoltaFondiId={raccolta.id}
              trigger={<Button size="sm">Nuovo sponsor/contributo</Button>}
            />
          )}
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Soggetto</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="text-right">Importo</TableHead>
                <TableHead>Stato</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {raccolta.sponsor.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    Nessuno sponsor collegato.
                  </TableCell>
                </TableRow>
              )}
              {raccolta.sponsor.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">
                    {s.soggetto ? `${s.soggetto.cognome} ${s.soggetto.nome}` : s.soggettoLibero}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {ETICHETTE_TIPI_SPONSOR[s.tipo as keyof typeof ETICHETTE_TIPI_SPONSOR] ?? s.tipo}
                  </TableCell>
                  <TableCell className="text-right">{formattaEuro(Number(s.importo))}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {ETICHETTE_STATI_SPONSOR[s.stato as keyof typeof ETICHETTE_STATI_SPONSOR] ?? s.stato}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <p className="mt-2 text-xs text-muted-foreground">
            Per incassare un contributo accettato, vai su{" "}
            <Link href="/eventi/sponsor" className="hover:underline">
              Sponsor e contributi
            </Link>
            .
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
