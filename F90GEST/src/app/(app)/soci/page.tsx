import Link from "next/link";
import { Plus } from "lucide-react";
import { richiediRuolo } from "@/lib/auth/richiedi-utente";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { badgeStatoPersona } from "@/lib/socio/stato-persona";

export default async function SociPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await richiediRuolo(["amministratore", "segreteria", "tesoriere", "sola_lettura"]);
  const { q } = await searchParams;
  const query = q?.trim() ?? "";

  const persone = await prisma.persona.findMany({
    where: {
      deletedAt: null,
      ...(query
        ? {
            OR: [
              { nome: { contains: query } },
              { cognome: { contains: query } },
              { codiceFiscale: { contains: query.toUpperCase() } },
            ],
          }
        : {}),
    },
    include: {
      socio: { include: { storicoStati: { select: { stato: true, dataInizio: true } } } },
      domandeAmmissione: { select: { stato: true, createdAt: true } },
    },
    orderBy: [{ cognome: "asc" }, { nome: "asc" }],
    take: 100,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Soci e tesseramenti</h1>
          <p className="text-sm text-muted-foreground">
            Anagrafica persone, domande di ammissione e libro soci.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/soci/libro-soci">Libro soci</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/soci/importa">Importa da Excel</Link>
          </Button>
          <Button asChild>
            <Link href="/soci/nuovo">
              <Plus /> Nuova persona
            </Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="space-y-4 pt-6">
          <form className="max-w-sm">
            <Input
              type="search"
              name="q"
              placeholder="Cerca per nome, cognome o codice fiscale..."
              defaultValue={query}
            />
          </form>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cognome e nome</TableHead>
                <TableHead>Codice fiscale</TableHead>
                <TableHead>Stato</TableHead>
                <TableHead className="text-right">N. libro soci</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {persone.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    Nessuna persona trovata.
                  </TableCell>
                </TableRow>
              )}
              {persone.map((persona) => {
                const badge = badgeStatoPersona(persona);
                return (
                  <TableRow key={persona.id}>
                    <TableCell className="font-medium">
                      <Link href={`/soci/${persona.id}`} className="hover:underline">
                        {persona.cognome} {persona.nome}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {persona.codiceFiscale ?? "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={badge.variante}>{badge.etichetta}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {persona.socio?.numeroLibroSoci ?? "—"}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
