"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, MailOpen, RefreshCw, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { sincronizzaCasellaEmail, segnaMessaggioLetto } from "@/lib/casella-email/actions";

export type MessaggioRicevutoRiga = {
  id: string;
  casellaEtichetta: string;
  casellaTipo: string;
  mittente: string;
  oggetto: string;
  dataMessaggio: string;
  letto: boolean;
  corpoTesto: string | null;
  corpoHtml: string | null;
};

type CasellaOpzione = { id: string; etichetta: string };

export function TabPostaInArrivo({
  messaggi,
  caselle,
}: {
  messaggi: MessaggioRicevutoRiga[];
  caselle: CasellaOpzione[];
}) {
  const router = useRouter();
  const [sincronizzando, setSincronizzando] = useState(false);
  const [dettaglio, setDettaglio] = useState<MessaggioRicevutoRiga | null>(null);

  async function onSincronizzaTutte() {
    if (caselle.length === 0) {
      toast.error("Nessuna casella email configurata. Configurala da Amministrazione → Email e PEC.");
      return;
    }
    setSincronizzando(true);
    let totaleNuovi = 0;
    let ultimoErrore: string | null = null;
    for (const casella of caselle) {
      const esito = await sincronizzaCasellaEmail(casella.id);
      if ("errore" in esito) {
        ultimoErrore = `${casella.etichetta}: ${esito.errore}`;
      } else {
        totaleNuovi += esito.nuovi;
      }
    }
    setSincronizzando(false);
    if (ultimoErrore) toast.error(`Alcune caselle non sono state sincronizzate. ${ultimoErrore}`);
    else toast.success(totaleNuovi > 0 ? `Scaricati ${totaleNuovi} nuovi messaggi.` : "Nessun nuovo messaggio.");
    router.refresh();
  }

  async function apriDettaglio(messaggio: MessaggioRicevutoRiga) {
    setDettaglio(messaggio);
    if (!messaggio.letto) {
      await segnaMessaggioLetto(messaggio.id, true);
      router.refresh();
    }
  }

  return (
    <Card>
      <CardContent className="space-y-4 pt-6">
        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={onSincronizzaTutte} disabled={sincronizzando}>
            {sincronizzando ? <Loader2 className="animate-spin" /> : <RefreshCw />}
            Sincronizza tutte le caselle
          </Button>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead></TableHead>
              <TableHead>Casella</TableHead>
              <TableHead>Mittente</TableHead>
              <TableHead>Oggetto</TableHead>
              <TableHead>Data</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {messaggi.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  Nessun messaggio scaricato. Configura una casella email da Amministrazione → Email e PEC, poi
                  sincronizza.
                </TableCell>
              </TableRow>
            )}
            {messaggi.map((m) => (
              <TableRow
                key={m.id}
                className="cursor-pointer"
                onClick={() => apriDettaglio(m)}
                data-stato={m.letto ? "letto" : "non-letto"}
              >
                <TableCell>{m.letto ? <MailOpen className="size-4 text-muted-foreground" /> : <Mail className="size-4" />}</TableCell>
                <TableCell>
                  <Badge variant={m.casellaTipo === "pec" ? "default" : "outline"}>{m.casellaEtichetta}</Badge>
                </TableCell>
                <TableCell className={m.letto ? "text-muted-foreground" : "font-medium"}>{m.mittente}</TableCell>
                <TableCell className={m.letto ? "text-muted-foreground" : "font-medium"}>{m.oggetto}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {new Date(m.dataMessaggio).toLocaleString("it-IT")}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>

      <Dialog open={dettaglio !== null} onOpenChange={(aperto) => !aperto && setDettaglio(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
          {dettaglio && (
            <>
              <DialogHeader>
                <DialogTitle>{dettaglio.oggetto}</DialogTitle>
              </DialogHeader>
              <p className="text-sm text-muted-foreground">
                Da: {dettaglio.mittente} — {new Date(dettaglio.dataMessaggio).toLocaleString("it-IT")}
              </p>
              {dettaglio.corpoHtml ? (
                // Contenuto HTML di un mittente esterno, mai fidato: niente
                // dangerouslySetInnerHTML. Un iframe con sandbox vuoto isola
                // l'origine (nessun cookie/storage/script eseguibile) ed è
                // il modo standard per mostrare un'anteprima email sicura.
                <iframe
                  sandbox=""
                  srcDoc={dettaglio.corpoHtml}
                  title="Contenuto del messaggio"
                  className="h-96 w-full rounded-md border"
                />
              ) : (
                <pre className="max-h-96 overflow-y-auto whitespace-pre-wrap rounded-md border p-3 text-sm">
                  {dettaglio.corpoTesto || "(messaggio senza contenuto testuale)"}
                </pre>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
