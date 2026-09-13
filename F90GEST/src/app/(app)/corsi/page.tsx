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
import { ETICHETTE_STATI_CORSO } from "@/lib/validazioni/corso";

const VARIANTE_STATO: Record<string, "success" | "warning" | "secondary" | "outline" | "destructive"> = {
  bozza: "secondary",
  aperto_iscrizioni: "success",
  in_corso: "warning",
  concluso: "outline",
  annullato: "destructive",
};

export default async function CorsiPage() {
  const utente = await richiediRuolo(["amministratore", "segreteria", "docente", "sola_lettura"]);
  const puoCreare = utente.ruolo === "amministratore" || utente.ruolo === "segreteria";

  // Un docente vede solo i corsi a cui è assegnato (§6 M4, "scheda docente
  // con accesso limitato ai propri corsi").
  const corsi = await prisma.corso.findMany({
    where: {
      deletedAt: null,
      ...(utente.ruolo === "docente" ? { docenti: { some: { personaId: utente.personaId ?? "" } } } : {}),
    },
    include: { _count: { select: { iscrizioni: { where: { deletedAt: null, stato: { not: "ritirato" } } } } } },
    orderBy: { dataInizio: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Corsi</h1>
          <p className="text-sm text-muted-foreground">
            Calendario lezioni, iscrizioni, appello e attestati di frequenza.
          </p>
        </div>
        {puoCreare && (
          <Button asChild>
            <Link href="/corsi/nuovo">
              <Plus /> Nuovo corso
            </Link>
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Titolo</TableHead>
                <TableHead>Sede</TableHead>
                <TableHead>Inizio</TableHead>
                <TableHead>Stato</TableHead>
                <TableHead className="text-right">Iscritti</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {corsi.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    Nessun corso presente.
                  </TableCell>
                </TableRow>
              )}
              {corsi.map((corso) => (
                <TableRow key={corso.id}>
                  <TableCell className="font-medium">
                    <Link href={`/corsi/${corso.id}`} className="hover:underline">
                      {corso.titolo}
                      {corso.edizione ? ` — ${corso.edizione}` : ""}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{corso.sede ?? "—"}</TableCell>
                  <TableCell>{new Intl.DateTimeFormat("it-IT").format(corso.dataInizio)}</TableCell>
                  <TableCell>
                    <Badge variant={VARIANTE_STATO[corso.stato] ?? "outline"}>
                      {ETICHETTE_STATI_CORSO[corso.stato as keyof typeof ETICHETTE_STATI_CORSO] ?? corso.stato}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {corso._count.iscrizioni}
                    {corso.capienzaMassima ? ` / ${corso.capienzaMassima}` : ""}
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
