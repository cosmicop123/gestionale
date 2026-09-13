"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ETICHETTE_TIPI_SPONSOR, ETICHETTE_STATI_SPONSOR } from "@/lib/validazioni/evento";
import { cambiaStatoSponsor } from "@/lib/sponsor/actions";
import { DialogNuovoSponsor, DialogIncassaSponsor } from "./sponsor-dialogs";

type PersonaOpzione = { id: string; nome: string; cognome: string };
type ContoOpzione = { id: string; nome: string };
type SponsorRiga = {
  id: string;
  soggetto: { nome: string; cognome: string } | null;
  soggettoLibero: string | null;
  tipo: string;
  importo: unknown;
  data: Date;
  stato: string;
  evento: { id: string; titolo: string } | null;
  raccoltaFondi: { id: string; denominazione: string } | null;
};

const VARIANTE_STATO: Record<string, "success" | "warning" | "secondary" | "outline" | "destructive"> = {
  richiesto: "outline",
  accettato: "warning",
  incassato: "success",
  rifiutato: "destructive",
};

function formattaEuro(valore: number): string {
  return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(valore);
}

export function TabSponsorGlobale({
  sponsorizzazioni,
  persone,
  conti,
  puoGestire,
  puoIncassare,
}: {
  sponsorizzazioni: SponsorRiga[];
  persone: PersonaOpzione[];
  conti: ContoOpzione[];
  puoGestire: boolean;
  puoIncassare: boolean;
}) {
  const router = useRouter();
  const [sponsorId, setSponsorId] = useState<string | null>(null);

  async function onCambiaStato(id: string, stato: "accettato" | "rifiutato") {
    const esito = await cambiaStatoSponsor(id, stato);
    if ("errore" in esito) {
      toast.error(esito.errore);
      return;
    }
    router.refresh();
  }

  return (
    <Card>
      <CardContent className="space-y-4 pt-6">
        {puoGestire && (
          <div className="flex justify-end">
            <DialogNuovoSponsor persone={persone} trigger={<Button size="sm"><Plus /> Nuovo sponsor/contributo</Button>} />
          </div>
        )}

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Soggetto</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Collegato a</TableHead>
              <TableHead className="text-right">Importo</TableHead>
              <TableHead>Stato</TableHead>
              {puoIncassare && <TableHead className="text-right">Azioni</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {sponsorizzazioni.length === 0 && (
              <TableRow>
                <TableCell colSpan={puoIncassare ? 6 : 5} className="text-center text-muted-foreground">
                  Nessuno sponsor o contributo registrato.
                </TableCell>
              </TableRow>
            )}
            {sponsorizzazioni.map((s) => (
              <TableRow key={s.id}>
                <TableCell className="font-medium">
                  {s.soggetto ? `${s.soggetto.cognome} ${s.soggetto.nome}` : s.soggettoLibero}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {ETICHETTE_TIPI_SPONSOR[s.tipo as keyof typeof ETICHETTE_TIPI_SPONSOR] ?? s.tipo}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {s.evento ? (
                    <Link href={`/eventi/${s.evento.id}`} className="hover:underline">
                      {s.evento.titolo}
                    </Link>
                  ) : s.raccoltaFondi ? (
                    <Link href={`/eventi/raccolte-fondi/${s.raccoltaFondi.id}`} className="hover:underline">
                      {s.raccoltaFondi.denominazione}
                    </Link>
                  ) : (
                    "—"
                  )}
                </TableCell>
                <TableCell className="text-right">{formattaEuro(Number(s.importo))}</TableCell>
                <TableCell>
                  <Badge variant={VARIANTE_STATO[s.stato] ?? "outline"}>
                    {ETICHETTE_STATI_SPONSOR[s.stato as keyof typeof ETICHETTE_STATI_SPONSOR] ?? s.stato}
                  </Badge>
                </TableCell>
                {puoIncassare && (
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {s.stato === "richiesto" && (
                        <>
                          <Button variant="outline" size="sm" onClick={() => onCambiaStato(s.id, "accettato")}>
                            Accetta
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => onCambiaStato(s.id, "rifiutato")}>
                            Rifiuta
                          </Button>
                        </>
                      )}
                      {s.stato === "accettato" && (
                        <Button size="sm" onClick={() => setSponsorId(s.id)}>
                          Incassa
                        </Button>
                      )}
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>

      <DialogIncassaSponsor sponsorId={sponsorId} conti={conti} onChiudi={() => setSponsorId(null)} />
    </Card>
  );
}
