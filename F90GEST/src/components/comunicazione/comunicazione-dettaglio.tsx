"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Send, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ETICHETTE_SEGMENTI_COMUNICAZIONE, ETICHETTE_STATI_COMUNICAZIONE } from "@/lib/validazioni/comunicazione";
import { inviaComunicazione, eliminaComunicazione } from "@/lib/comunicazione/actions";

const ETICHETTE_STATI_INVIO: Record<string, string> = {
  in_coda: "In coda",
  inviata: "Inviata",
  fallita: "Fallita",
  non_inviata_per_consenso_revocato: "Non inviata (consenso assente/revocato)",
};

type ComunicazioneConInvii = {
  id: string;
  titolo: string;
  segmento: string;
  stato: string;
  templateOggetto: string;
  templateCorpo: string;
  invii: {
    id: string;
    emailDestinatario: string;
    stato: string;
    dataInvio: Date | null;
    erroreMessaggio: string | null;
    persona: { nome: string; cognome: string };
  }[];
};

export function ComunicazioneDettaglio({ comunicazione }: { comunicazione: ComunicazioneConInvii }) {
  const router = useRouter();
  const [inAttesa, setInAttesa] = useState(false);

  async function onInvia() {
    setInAttesa(true);
    const esito = await inviaComunicazione(comunicazione.id);
    setInAttesa(false);
    if ("errore" in esito) {
      toast.error(esito.errore);
      return;
    }
    toast.success(`Invio completato: ${esito.inviate}/${esito.totale} email inviate.`);
    router.refresh();
  }

  async function onElimina() {
    const esito = await eliminaComunicazione(comunicazione.id);
    if ("errore" in esito) {
      toast.error(esito.errore);
      return;
    }
    toast.success("Comunicazione eliminata.");
    router.push("/comunicazioni");
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{comunicazione.titolo}</h1>
          <p className="text-sm text-muted-foreground">
            {ETICHETTE_SEGMENTI_COMUNICAZIONE[comunicazione.segmento as keyof typeof ETICHETTE_SEGMENTI_COMUNICAZIONE] ??
              comunicazione.segmento}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={comunicazione.stato === "inviata" ? "default" : "outline"}>
            {ETICHETTE_STATI_COMUNICAZIONE[comunicazione.stato as keyof typeof ETICHETTE_STATI_COMUNICAZIONE] ?? comunicazione.stato}
          </Badge>
          {comunicazione.stato === "bozza" && (
            <>
              <Button variant="outline" size="sm" onClick={onElimina}>
                <Trash2 /> Elimina bozza
              </Button>
              <Button size="sm" onClick={onInvia} disabled={inAttesa}>
                {inAttesa ? <Loader2 className="animate-spin" /> : <Send />}
                Invia ora
              </Button>
            </>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Anteprima</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm">
            <span className="font-medium">Oggetto:</span> {comunicazione.templateOggetto}
          </p>
          <p className="whitespace-pre-wrap text-sm text-muted-foreground">{comunicazione.templateCorpo}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Invii ({comunicazione.invii.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Destinatario</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Stato</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {comunicazione.invii.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground">
                    Nessun invio ancora effettuato.
                  </TableCell>
                </TableRow>
              )}
              {comunicazione.invii.map((invio) => (
                <TableRow key={invio.id}>
                  <TableCell className="font-medium">
                    {invio.persona.cognome} {invio.persona.nome}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{invio.emailDestinatario}</TableCell>
                  <TableCell>
                    <Badge variant={invio.stato === "inviata" ? "default" : "outline"} title={invio.erroreMessaggio ?? undefined}>
                      {ETICHETTE_STATI_INVIO[invio.stato] ?? invio.stato}
                    </Badge>
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
