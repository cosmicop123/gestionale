import Link from "next/link";
import { Plus } from "lucide-react";
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
import { ETICHETTE_SEGMENTI_COMUNICAZIONE, ETICHETTE_STATI_COMUNICAZIONE } from "@/lib/validazioni/comunicazione";

export default async function ComunicazioniPage() {
  await richiediRuolo(["amministratore", "segreteria"]);

  const comunicazioni = await prisma.comunicazione.findMany({
    where: { deletedAt: null },
    include: { _count: { select: { invii: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Comunicazioni</h1>
          <p className="text-sm text-muted-foreground">
            Invia email segmentate a soci, iscritti ai corsi, volontari o a una selezione personalizzata.
          </p>
        </div>
        <Button asChild>
          <Link href="/comunicazioni/nuova">
            <Plus /> Nuova comunicazione
          </Link>
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Titolo</TableHead>
                <TableHead>Segmento</TableHead>
                <TableHead>Stato</TableHead>
                <TableHead className="text-right">Destinatari</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {comunicazioni.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    Nessuna comunicazione creata.
                  </TableCell>
                </TableRow>
              )}
              {comunicazioni.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">
                    <Link href={`/comunicazioni/${c.id}`} className="hover:underline">
                      {c.titolo}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {ETICHETTE_SEGMENTI_COMUNICAZIONE[c.segmento as keyof typeof ETICHETTE_SEGMENTI_COMUNICAZIONE] ?? c.segmento}
                  </TableCell>
                  <TableCell>
                    <Badge variant={c.stato === "inviata" ? "default" : "outline"}>
                      {ETICHETTE_STATI_COMUNICAZIONE[c.stato as keyof typeof ETICHETTE_STATI_COMUNICAZIONE] ?? c.stato}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">{c._count.invii}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
