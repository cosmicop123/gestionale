import Link from "next/link";
import { Plus, HandCoins, PiggyBank } from "lucide-react";
import { richiediRuolo } from "@/lib/auth/richiedi-utente";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ETICHETTE_STATI_EVENTO, ETICHETTE_TIPOLOGIE_EVENTO } from "@/lib/validazioni/evento";

const VARIANTE_STATO: Record<string, "success" | "warning" | "secondary" | "outline" | "destructive"> = {
  bozza: "secondary",
  programmato: "success",
  in_corso: "warning",
  concluso: "outline",
  annullato: "destructive",
};

export default async function EventiPage() {
  const utente = await richiediRuolo(["amministratore", "segreteria", "tesoriere", "sola_lettura"]);
  const puoCreare = utente.ruolo === "amministratore" || utente.ruolo === "segreteria";

  const eventi = await prisma.evento.findMany({
    where: { deletedAt: null },
    include: { _count: { select: { partecipazioni: true } } },
    orderBy: { dataInizio: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Eventi</h1>
          <p className="text-sm text-muted-foreground">
            Spettacoli, feste, conferenze: partecipazioni, turni volontari, pratiche SIAE e sponsor.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/eventi/raccolte-fondi">
              <PiggyBank /> Raccolte fondi
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/eventi/sponsor">
              <HandCoins /> Sponsor e contributi
            </Link>
          </Button>
          {puoCreare && (
            <Button asChild>
              <Link href="/eventi/nuovo">
                <Plus /> Nuovo evento
              </Link>
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Titolo</TableHead>
                <TableHead>Tipologia</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Stato</TableHead>
                <TableHead className="text-right">Partecipanti</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {eventi.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    Nessun evento presente.
                  </TableCell>
                </TableRow>
              )}
              {eventi.map((evento) => (
                <TableRow key={evento.id}>
                  <TableCell className="font-medium">
                    <Link href={`/eventi/${evento.id}`} className="hover:underline">
                      {evento.titolo}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {ETICHETTE_TIPOLOGIE_EVENTO[evento.tipologia as keyof typeof ETICHETTE_TIPOLOGIE_EVENTO] ??
                      evento.tipologia}
                  </TableCell>
                  <TableCell>{new Intl.DateTimeFormat("it-IT").format(evento.dataInizio)}</TableCell>
                  <TableCell>
                    <Badge variant={VARIANTE_STATO[evento.stato] ?? "outline"}>
                      {ETICHETTE_STATI_EVENTO[evento.stato as keyof typeof ETICHETTE_STATI_EVENTO] ?? evento.stato}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {evento._count.partecipazioni}
                    {evento.capienza ? ` / ${evento.capienza}` : ""}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
