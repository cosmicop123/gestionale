import Link from "next/link";
import { Plus } from "lucide-react";
import { richiediRuolo } from "@/lib/auth/richiedi-utente";
import { prisma } from "@/lib/prisma";
import { calcolaSaldoRaccolta } from "@/lib/raccolta-fondi/saldo";
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

export default async function RaccolteFondiPage() {
  const utente = await richiediRuolo(["amministratore", "segreteria", "tesoriere", "sola_lettura"]);
  const puoCreare = utente.ruolo === "amministratore" || utente.ruolo === "segreteria";

  const raccolte = await prisma.raccoltaFondi.findMany({
    where: { deletedAt: null },
    include: { evento: true, movimenti: { select: { tipo: true, importo: true } } },
    orderBy: { periodoInizio: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Raccolte fondi</h1>
          <p className="text-sm text-muted-foreground">Raccolte fondi occasionali, collegate o meno a un evento.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/eventi" className="self-center text-sm text-muted-foreground hover:underline">
            ← Torna agli eventi
          </Link>
          {puoCreare && (
            <Button asChild>
              <Link href="/eventi/raccolte-fondi/nuova">
                <Plus /> Nuova raccolta fondi
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
                <TableHead>Denominazione</TableHead>
                <TableHead>Periodo</TableHead>
                <TableHead>Evento collegato</TableHead>
                <TableHead className="text-right">Saldo raccolto</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {raccolte.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    Nessuna raccolta fondi presente.
                  </TableCell>
                </TableRow>
              )}
              {raccolte.map((r) => {
                const saldo = calcolaSaldoRaccolta(
                  r.movimenti.map((m) => ({ tipo: m.tipo, importo: Number(m.importo) }))
                );
                return (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">
                      <Link href={`/eventi/raccolte-fondi/${r.id}`} className="hover:underline">
                        {r.denominazione}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Intl.DateTimeFormat("it-IT").format(r.periodoInizio)}
                      {r.periodoFine ? ` – ${new Intl.DateTimeFormat("it-IT").format(r.periodoFine)}` : ""}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{r.evento?.titolo ?? "—"}</TableCell>
                    <TableCell className="text-right">
                      {new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(saldo)}
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
