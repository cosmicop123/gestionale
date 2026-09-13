"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Award, Download } from "lucide-react";
import { toast } from "sonner";

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
import { generaAttestatiCorso } from "@/lib/attestato/actions";

type IscrizioneAttestato = {
  id: string;
  persona: { nome: string; cognome: string };
  riepilogo: { oreFrequentate: number; oreTotaliSvolte: number; percentualePresenza: number };
  idoneo: boolean;
  attestato: { id: string; numeroProgressivo: number } | null;
};

export function TabAttestati({
  corsoId,
  iscrizioni,
  sogliaMinima,
  puoGestire,
}: {
  corsoId: string;
  iscrizioni: IscrizioneAttestato[];
  sogliaMinima: number;
  puoGestire: boolean;
}) {
  const router = useRouter();
  const [inCorso, setInCorso] = useState(false);

  const daGenerare = iscrizioni.filter((i) => i.idoneo && !i.attestato).length;

  async function onGeneraMassivo() {
    setInCorso(true);
    const esito = await generaAttestatiCorso(corsoId);
    setInCorso(false);
    if ("errore" in esito) {
      toast.error(esito.errore);
      return;
    }
    toast.success(`Generati ${esito.generati} attestati (${esito.nonIdonei} non idonei).`);
    router.refresh();
  }

  return (
    <Card>
      <CardContent className="space-y-4 pt-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            Soglia minima di presenza per l&apos;attestato: {sogliaMinima}%.
          </p>
          {puoGestire && (
            <Button size="sm" onClick={onGeneraMassivo} disabled={inCorso || daGenerare === 0}>
              {inCorso && <Loader2 className="animate-spin" />}
              <Award /> Genera attestati mancanti ({daGenerare})
            </Button>
          )}
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Persona</TableHead>
              <TableHead className="text-right">Ore frequentate</TableHead>
              <TableHead className="text-right">% presenza</TableHead>
              <TableHead>Idoneo</TableHead>
              <TableHead className="text-right">Attestato</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {iscrizioni.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  Nessuna iscrizione attiva.
                </TableCell>
              </TableRow>
            )}
            {iscrizioni.map((iscrizione) => (
              <TableRow key={iscrizione.id}>
                <TableCell className="font-medium">
                  {iscrizione.persona.cognome} {iscrizione.persona.nome}
                </TableCell>
                <TableCell className="text-right">
                  {iscrizione.riepilogo.oreFrequentate} / {iscrizione.riepilogo.oreTotaliSvolte}
                </TableCell>
                <TableCell className="text-right">{iscrizione.riepilogo.percentualePresenza.toFixed(0)}%</TableCell>
                <TableCell>
                  <Badge variant={iscrizione.idoneo ? "success" : "outline"}>
                    {iscrizione.idoneo ? "Sì" : "No"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  {iscrizione.attestato ? (
                    <Button variant="outline" size="sm" asChild>
                      <a
                        href={`/corsi/attestati/${iscrizione.attestato.id}/pdf`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Download /> n. {iscrizione.attestato.numeroProgressivo}
                      </a>
                    </Button>
                  ) : (
                    "—"
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
