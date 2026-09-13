"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Paperclip } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
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
import {
  TIPI_PROTOCOLLO,
  ETICHETTE_TIPI_PROTOCOLLO,
  MEZZI_PROTOCOLLO,
  ETICHETTE_MEZZI_PROTOCOLLO,
} from "@/lib/validazioni/protocollo";
import { registraProtocollo } from "@/lib/protocollo/actions";

type ProtocolloRiga = {
  id: string;
  numero: number;
  annoRiferimento: number;
  tipo: string;
  data: Date;
  mittenteDestinatario: string;
  oggetto: string;
  mezzo: string;
  allegatoId: string | null;
};

function classiCampo(): string {
  return "border-input flex h-11 w-full rounded-md border bg-transparent px-3 py-2 text-base shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] md:text-sm";
}

function DialogNuovoProtocollo() {
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
    const esito = await registraProtocollo(
      {
        tipo: formData.get("tipo") as (typeof TIPI_PROTOCOLLO)[number],
        data: String(formData.get("data") ?? ""),
        mittenteDestinatario: String(formData.get("mittenteDestinatario") ?? ""),
        oggetto: String(formData.get("oggetto") ?? ""),
        mezzo: formData.get("mezzo") as (typeof MEZZI_PROTOCOLLO)[number],
        classificazione: String(formData.get("classificazione") ?? ""),
      },
      formData
    );
    setInAttesa(false);
    if ("errore" in esito) {
      setErrore(esito.errore);
      return;
    }
    toast.success("Protocollo registrato.");
    setAperto(false);
    formRef.current?.reset();
    router.refresh();
  }

  return (
    <Dialog open={aperto} onOpenChange={setAperto}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus /> Nuovo protocollo
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nuovo protocollo</DialogTitle>
        </DialogHeader>
        <form ref={formRef} className="space-y-4" onSubmit={onSubmit} encType="multipart/form-data">
          <div className="space-y-2">
            <Label htmlFor="tipo">Tipo</Label>
            <select id="tipo" name="tipo" className={classiCampo()}>
              {TIPI_PROTOCOLLO.map((t) => (
                <option key={t} value={t}>
                  {ETICHETTE_TIPI_PROTOCOLLO[t]}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="data">Data</Label>
            <Input id="data" name="data" type="date" defaultValue={new Date().toISOString().slice(0, 10)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="mittenteDestinatario">Mittente / destinatario</Label>
            <Input id="mittenteDestinatario" name="mittenteDestinatario" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="oggetto">Oggetto</Label>
            <Input id="oggetto" name="oggetto" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="mezzo">Mezzo</Label>
            <select id="mezzo" name="mezzo" className={classiCampo()}>
              {MEZZI_PROTOCOLLO.map((m) => (
                <option key={m} value={m}>
                  {ETICHETTE_MEZZI_PROTOCOLLO[m]}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="classificazione">Classificazione (facoltativa)</Label>
            <Input id="classificazione" name="classificazione" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="allegato" className="flex items-center gap-1.5">
              <Paperclip className="size-4" /> Allegato (facoltativo)
            </Label>
            <input id="allegato" name="allegato" type="file" accept="image/*,application/pdf" className="text-sm" />
          </div>
          {errore && <p className="text-sm text-destructive">{errore}</p>}
          <DialogFooter>
            <Button type="submit" disabled={inAttesa}>
              {inAttesa && <Loader2 className="animate-spin" />}
              Registra
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function TabProtocollo({ protocolli, puoGestire }: { protocolli: ProtocolloRiga[]; puoGestire: boolean }) {
  return (
    <Card>
      <CardContent className="space-y-4 pt-6">
        {puoGestire && (
          <div className="flex justify-end">
            <DialogNuovoProtocollo />
          </div>
        )}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>N.</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Mittente/destinatario</TableHead>
              <TableHead>Oggetto</TableHead>
              <TableHead>Mezzo</TableHead>
              <TableHead className="text-right">Allegato</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {protocolli.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  Nessun protocollo registrato.
                </TableCell>
              </TableRow>
            )}
            {protocolli.map((p) => (
              <TableRow key={p.id}>
                <TableCell>
                  {p.numero}/{p.annoRiferimento}
                </TableCell>
                <TableCell>
                  <Badge variant={p.tipo === "entrata" ? "success" : "outline"}>
                    {ETICHETTE_TIPI_PROTOCOLLO[p.tipo as keyof typeof ETICHETTE_TIPI_PROTOCOLLO] ?? p.tipo}
                  </Badge>
                </TableCell>
                <TableCell>{new Intl.DateTimeFormat("it-IT").format(p.data)}</TableCell>
                <TableCell>{p.mittenteDestinatario}</TableCell>
                <TableCell className="max-w-xs truncate">{p.oggetto}</TableCell>
                <TableCell className="text-muted-foreground">
                  {ETICHETTE_MEZZI_PROTOCOLLO[p.mezzo as keyof typeof ETICHETTE_MEZZI_PROTOCOLLO] ?? p.mezzo}
                </TableCell>
                <TableCell className="text-right">
                  {p.allegatoId ? (
                    <Button variant="outline" size="sm" asChild>
                      <a href={`/contabilita/allegati/${p.allegatoId}`} target="_blank" rel="noopener noreferrer">
                        Apri
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
