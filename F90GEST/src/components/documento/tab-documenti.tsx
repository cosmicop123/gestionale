"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Download, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CATEGORIE_DOCUMENTO, ETICHETTE_CATEGORIE_DOCUMENTO } from "@/lib/validazioni/protocollo";
import { caricaDocumento, caricaNuovaVersioneDocumento, eliminaDocumento } from "@/lib/documento/actions";

type DocumentoRiga = {
  id: string;
  titolo: string;
  categoria: string;
  allegatoId: string;
  scadenza: Date | null;
  versione: number;
};

function classiCampo(): string {
  return "border-input flex h-11 w-full rounded-md border bg-transparent px-3 py-2 text-base shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] md:text-sm";
}

function DialogNuovoDocumento() {
  const router = useRouter();
  const [aperto, setAperto] = useState(false);
  const [inAttesa, setInAttesa] = useState(false);
  const [errore, setErrore] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setInAttesa(true);
    setErrore(null);
    const formData = new FormData(e.currentTarget);
    const esito = await caricaDocumento(
      {
        titolo: String(formData.get("titolo") ?? ""),
        categoria: formData.get("categoria") as (typeof CATEGORIE_DOCUMENTO)[number],
        scadenza: String(formData.get("scadenza") ?? ""),
      },
      formData
    );
    setInAttesa(false);
    if ("errore" in esito) {
      setErrore(esito.errore);
      return;
    }
    toast.success("Documento caricato.");
    setAperto(false);
    formRef.current?.reset();
    router.refresh();
  }

  return (
    <Dialog open={aperto} onOpenChange={setAperto}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus /> Carica documento
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Carica un documento</DialogTitle>
          <DialogDescription>Statuto, bilanci, contratti, assicurazioni e altri documenti dell&apos;associazione.</DialogDescription>
        </DialogHeader>
        <form ref={formRef} className="space-y-4" onSubmit={onSubmit} encType="multipart/form-data">
          <div className="space-y-2">
            <Label htmlFor="titolo">Titolo</Label>
            <Input id="titolo" name="titolo" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="categoria">Categoria</Label>
            <select id="categoria" name="categoria" className={classiCampo()}>
              {CATEGORIE_DOCUMENTO.map((c) => (
                <option key={c} value={c}>
                  {ETICHETTE_CATEGORIE_DOCUMENTO[c]}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="scadenza">Scadenza (facoltativa)</Label>
            <Input id="scadenza" name="scadenza" type="date" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="file">File</Label>
            <input id="file" name="file" type="file" className="text-sm" />
          </div>
          {errore && <p className="text-sm text-destructive">{errore}</p>}
          <DialogFooter>
            <Button type="submit" disabled={inAttesa}>
              {inAttesa && <Loader2 className="animate-spin" />}
              Carica
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function BottoneNuovaVersione({ documentoId }: { documentoId: string }) {
  const router = useRouter();
  const [inCaricamento, setInCaricamento] = useState(false);

  async function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.set("file", file);
    setInCaricamento(true);
    const esito = await caricaNuovaVersioneDocumento(documentoId, formData);
    setInCaricamento(false);
    if ("errore" in esito) {
      toast.error(esito.errore);
      return;
    }
    toast.success("Nuova versione caricata.");
    router.refresh();
  }

  return (
    <Label className="cursor-pointer">
      <span className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
        {inCaricamento ? <Loader2 className="size-3 animate-spin" /> : <Upload className="size-3" />}
        Nuova versione
      </span>
      <input type="file" className="hidden" onChange={onChange} disabled={inCaricamento} />
    </Label>
  );
}

export function TabDocumenti({ documenti, puoGestire }: { documenti: DocumentoRiga[]; puoGestire: boolean }) {
  const router = useRouter();

  async function onElimina(documentoId: string) {
    const esito = await eliminaDocumento(documentoId);
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
            <DialogNuovoDocumento />
          </div>
        )}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Titolo</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Scadenza</TableHead>
              <TableHead>Versione</TableHead>
              <TableHead className="text-right">Azioni</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {documenti.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  Nessun documento caricato.
                </TableCell>
              </TableRow>
            )}
            {documenti.map((d) => {
              const scaduto = d.scadenza && d.scadenza < new Date();
              return (
                <TableRow key={d.id}>
                  <TableCell className="font-medium">{d.titolo}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {ETICHETTE_CATEGORIE_DOCUMENTO[d.categoria as keyof typeof ETICHETTE_CATEGORIE_DOCUMENTO] ??
                      d.categoria}
                  </TableCell>
                  <TableCell>
                    {d.scadenza ? (
                      <Badge variant={scaduto ? "destructive" : "outline"}>
                        {new Intl.DateTimeFormat("it-IT").format(d.scadenza)}
                      </Badge>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">v{d.versione}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end items-center gap-3">
                      <Button variant="outline" size="sm" asChild>
                        <a href={`/contabilita/allegati/${d.allegatoId}`} target="_blank" rel="noopener noreferrer">
                          <Download /> Apri
                        </a>
                      </Button>
                      {puoGestire && (
                        <>
                          <BottoneNuovaVersione documentoId={d.id} />
                          <Button variant="ghost" size="icon" onClick={() => onElimina(d.id)}>
                            <Trash2 className="text-destructive" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
