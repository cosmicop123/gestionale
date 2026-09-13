import Link from "next/link";
import { Plus, BookMarked } from "lucide-react";
import { richiediRuolo } from "@/lib/auth/richiedi-utente";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ETICHETTE_TIPI_RIUNIONE } from "@/lib/validazioni/riunione";

export default async function LibriSocialiPage() {
  const utente = await richiediRuolo(["amministratore", "segreteria", "tesoriere", "sola_lettura"]);
  const puoCreare = utente.ruolo === "amministratore" || utente.ruolo === "segreteria";

  const riunioni = await prisma.riunione.findMany({
    where: { deletedAt: null },
    include: { _count: { select: { partecipanti: true, delibere: true } } },
    orderBy: { data: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Libri sociali</h1>
          <p className="text-sm text-muted-foreground">
            Libro soci, verbali di assemblea e consiglio direttivo, delibere.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/soci/libro-soci">
              <BookMarked /> Libro soci
            </Link>
          </Button>
          {puoCreare && (
            <Button asChild>
              <Link href="/libri-sociali/riunioni/nuova">
                <Plus /> Nuova riunione
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
                <TableHead>Tipo</TableHead>
                <TableHead>N.</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Ordine del giorno</TableHead>
                <TableHead className="text-right">Delibere</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {riunioni.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    Nessuna riunione registrata.
                  </TableCell>
                </TableRow>
              )}
              {riunioni.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">
                    <Link href={`/libri-sociali/riunioni/${r.id}`} className="hover:underline">
                      {ETICHETTE_TIPI_RIUNIONE[r.tipo as keyof typeof ETICHETTE_TIPI_RIUNIONE] ?? r.tipo}
                    </Link>
                  </TableCell>
                  <TableCell>{r.numeroProgressivo}</TableCell>
                  <TableCell>{new Intl.DateTimeFormat("it-IT").format(r.data)}</TableCell>
                  <TableCell className="max-w-md truncate text-muted-foreground">{r.ordineDelGiorno}</TableCell>
                  <TableCell className="text-right">{r._count.delibere}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
