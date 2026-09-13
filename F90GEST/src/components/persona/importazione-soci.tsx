"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import * as XLSX from "xlsx";
import { Loader2, Upload, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  CAMPI_IMPORT_SOCI,
  CAMPI_OBBLIGATORI,
  ETICHETTE_CAMPI_IMPORT,
  validaRigaImport,
  type CampoImportSoci,
  type RigaGrezzaImport,
} from "@/lib/validazioni/import-soci";
import { importaPersone, type EsitoRigaImport } from "@/lib/persona/importa-actions";

const DIMENSIONE_MASSIMA_BYTE = 5 * 1024 * 1024; // 5 MB
const RIGHE_MASSIME = 2000;
const VALORE_NON_MAPPATO = "__non_mappato__";

type Passo = "carica" | "mappa" | "anteprima" | "risultato";

export function ImportazioneSoci() {
  const [passo, setPasso] = useState<Passo>("carica");
  const [intestazioni, setIntestazioni] = useState<string[]>([]);
  const [righeGrezze, setRigheGrezze] = useState<string[][]>([]);
  const [mappatura, setMappatura] = useState<Partial<Record<CampoImportSoci, string>>>({});
  const [inAttesa, setInAttesa] = useState(false);
  const [risultato, setRisultato] = useState<{ importate: number; scartate: number; dettaglio: EsitoRigaImport[] } | null>(null);

  async function onFileSelezionato(file: File) {
    if (file.size > DIMENSIONE_MASSIMA_BYTE) {
      toast.error("Il file supera i 5 MB consentiti.");
      return;
    }
    try {
      const buffer = await file.arrayBuffer();
      const cartella = XLSX.read(buffer, { type: "array" });
      const primoFoglio = cartella.Sheets[cartella.SheetNames[0]];
      const righe = XLSX.utils.sheet_to_json<string[]>(primoFoglio, { header: 1, raw: false, defval: "" });

      if (righe.length === 0) {
        toast.error("Il file non contiene righe leggibili.");
        return;
      }
      if (righe.length - 1 > RIGHE_MASSIME) {
        toast.error(`Il file contiene troppe righe (massimo ${RIGHE_MASSIME}, esclusa l'intestazione).`);
        return;
      }

      setIntestazioni(righe[0].map((h) => String(h ?? "").trim()));
      setRigheGrezze(righe.slice(1).filter((r) => r.some((c) => String(c ?? "").trim() !== "")));
      setMappatura({});
      setPasso("mappa");
    } catch {
      toast.error("Impossibile leggere il file: verificare che sia un .xlsx, .xls o .csv valido.");
    }
  }

  const righeMappate = useMemo<RigaGrezzaImport[]>(() => {
    return righeGrezze.map((riga) => {
      const oggetto: RigaGrezzaImport = {};
      for (const campo of CAMPI_IMPORT_SOCI) {
        const nomeColonna = mappatura[campo];
        if (!nomeColonna) continue;
        const indiceColonna = intestazioni.indexOf(nomeColonna);
        if (indiceColonna >= 0) {
          oggetto[campo] = String(riga[indiceColonna] ?? "").trim();
        }
      }
      return oggetto;
    });
  }, [righeGrezze, intestazioni, mappatura]);

  const anteprimaValidata = useMemo(
    () => righeMappate.map((riga, indice) => validaRigaImport(riga, indice)),
    [righeMappate]
  );
  const numeroValide = anteprimaValidata.filter((r) => r.valida).length;

  const campiObbligatoriMappati = CAMPI_OBBLIGATORI.every((campo) => !!mappatura[campo]);

  async function confermaImportazione() {
    setInAttesa(true);
    try {
      const esito = await importaPersone(righeMappate);
      if ("errore" in esito) {
        toast.error(esito.errore);
        return;
      }
      setRisultato(esito);
      setPasso("risultato");
      toast.success(`Importate ${esito.importate} persone su ${righeMappate.length}.`);
    } catch {
      toast.error("Errore imprevisto durante l'importazione.");
    } finally {
      setInAttesa(false);
    }
  }

  if (passo === "carica") {
    return (
      <Card>
        <CardContent className="space-y-4 pt-6">
          <p className="text-sm text-muted-foreground">
            Carica un file Excel (.xlsx) o CSV con l&apos;elenco dei soci esistenti. Il file viene
            letto solo nel tuo browser: non viene inviato al server prima della verifica.
          </p>
          <label className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed p-10 text-center hover:bg-accent/40">
            <Upload className="size-8 text-muted-foreground" />
            <span className="text-sm font-medium">Scegli un file .xlsx, .xls o .csv</span>
            <span className="text-xs text-muted-foreground">Massimo 5 MB, {RIGHE_MASSIME} righe</span>
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onFileSelezionato(file);
              }}
            />
          </label>
        </CardContent>
      </Card>
    );
  }

  if (passo === "mappa") {
    return (
      <Card>
        <CardContent className="space-y-4 pt-6">
          <p className="text-sm text-muted-foreground">
            Trovate {righeGrezze.length} righe. Abbina le colonne del file ai campi del gestionale.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            {CAMPI_IMPORT_SOCI.map((campo) => (
              <div key={campo} className="space-y-2">
                <Label>{ETICHETTE_CAMPI_IMPORT[campo]}</Label>
                <Select
                  value={mappatura[campo] ?? VALORE_NON_MAPPATO}
                  onValueChange={(valore) =>
                    setMappatura((prec) => ({
                      ...prec,
                      [campo]: valore === VALORE_NON_MAPPATO ? undefined : valore,
                    }))
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={VALORE_NON_MAPPATO}>-- non presente --</SelectItem>
                    {intestazioni.map((intestazione) => (
                      <SelectItem key={intestazione} value={intestazione}>
                        {intestazione}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setPasso("carica")}>
              Indietro
            </Button>
            <Button disabled={!campiObbligatoriMappati} onClick={() => setPasso("anteprima")}>
              Vedi anteprima
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (passo === "anteprima") {
    return (
      <Card>
        <CardContent className="space-y-4 pt-6">
          <p className="text-sm">
            <strong>{numeroValide}</strong> righe valide su <strong>{anteprimaValidata.length}</strong>.
            Solo le righe valide verranno importate.
          </p>
          <div className="max-h-96 overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Riga</TableHead>
                  <TableHead>Nome e cognome</TableHead>
                  <TableHead>Esito</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {anteprimaValidata.map((riga) => (
                  <TableRow key={riga.indiceOriginale}>
                    <TableCell>{riga.indiceOriginale + 2}</TableCell>
                    <TableCell>
                      {riga.dati.cognome} {riga.dati.nome}
                    </TableCell>
                    <TableCell>
                      {riga.valida ? (
                        <Badge variant="success">
                          <CheckCircle2 /> Valida
                        </Badge>
                      ) : (
                        <span className="flex items-center gap-1 text-sm text-destructive">
                          <XCircle className="size-4 shrink-0" />
                          {riga.errori.join(" ")}
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setPasso("mappa")}>
              Indietro
            </Button>
            <Button onClick={confermaImportazione} disabled={inAttesa || numeroValide === 0}>
              {inAttesa && <Loader2 className="animate-spin" />}
              Importa {numeroValide} persone
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="space-y-4 pt-6">
        <p className="text-sm">
          Importate <strong>{risultato?.importate}</strong> persone, scartate{" "}
          <strong>{risultato?.scartate}</strong>.
        </p>
        {!!risultato?.dettaglio.some((r) => r.esito === "scartata") && (
          <div>
            <p className="mb-2 text-sm font-medium">Report degli scarti</p>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Riga</TableHead>
                  <TableHead>Nome e cognome</TableHead>
                  <TableHead>Motivo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {risultato.dettaglio
                  .filter((r) => r.esito === "scartata")
                  .map((r) => (
                    <TableRow key={r.indiceOriginale}>
                      <TableCell>{r.indiceOriginale + 2}</TableCell>
                      <TableCell>{r.nomeCompleto}</TableCell>
                      <TableCell className="text-destructive">{r.errori.join(" ")}</TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </div>
        )}
        <Button asChild>
          <Link href="/soci">Vai all&apos;elenco soci</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
