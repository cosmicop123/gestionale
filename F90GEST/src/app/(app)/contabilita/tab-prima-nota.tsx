"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus, Paperclip } from "lucide-react";
import { toast } from "sonner";
import type { Conto, MovimentoPrimaNota } from "@prisma/client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  CATEGORIE_RENDICONTO_ENTRATA,
  CATEGORIE_RENDICONTO_USCITA,
  ETICHETTE_CATEGORIE_RENDICONTO,
  schemaStorno,
} from "@/lib/validazioni/contabilita";
import { registraMovimentoManuale, stornaMovimento } from "@/lib/movimento/actions";

type MovimentoConRelazioni = MovimentoPrimaNota & {
  conto: { nome: string };
  controparte: { nome: string; cognome: string } | null;
};

function formattaEuro(valore: number): string {
  return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(valore);
}

function classiCampo(haErrore?: boolean) {
  return `border-input flex h-11 w-full rounded-md border bg-transparent px-3 py-2 text-base shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] md:text-sm ${haErrore ? "border-destructive" : ""}`;
}

function NuovoMovimentoDialog({ conti }: { conti: Conto[] }) {
  const router = useRouter();
  const [aperto, setAperto] = useState(false);
  const [tipo, setTipo] = useState<"entrata" | "uscita">("entrata");
  const [inAttesa, setInAttesa] = useState(false);
  const [errore, setErrore] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  async function onSubmit(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setInAttesa(true);
    setErrore(null);
    try {
      const formData = new FormData(evento.currentTarget);
      const esito = await registraMovimentoManuale(formData);
      if ("errore" in esito) {
        setErrore(esito.errore);
        toast.error(esito.errore);
        return;
      }
      toast.success("Movimento registrato.");
      setAperto(false);
      formRef.current?.reset();
      router.refresh();
    } catch {
      toast.error("Errore imprevisto durante la registrazione.");
    } finally {
      setInAttesa(false);
    }
  }

  const categorie = tipo === "entrata" ? CATEGORIE_RENDICONTO_ENTRATA : CATEGORIE_RENDICONTO_USCITA;

  return (
    <Dialog open={aperto} onOpenChange={setAperto}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus /> Nuovo movimento
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nuovo movimento di prima nota</DialogTitle>
          <DialogDescription>
            Per le uscite oltre la soglia configurata è richiesto un giustificativo o una
            motivazione (§8).
          </DialogDescription>
        </DialogHeader>
        <form ref={formRef} className="space-y-4" onSubmit={onSubmit} encType="multipart/form-data">
          <div className="space-y-2">
            <Label htmlFor="tipo">Tipo</Label>
            <select
              id="tipo"
              name="tipo"
              className={classiCampo()}
              value={tipo}
              onChange={(e) => setTipo(e.target.value as "entrata" | "uscita")}
            >
              <option value="entrata">Entrata</option>
              <option value="uscita">Uscita</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="data">Data</Label>
              <Input id="data" name="data" type="date" defaultValue={new Date().toISOString().slice(0, 10)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="importo">Importo</Label>
              <Input id="importo" name="importo" type="number" step="0.01" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="contoId">Conto</Label>
            <select id="contoId" name="contoId" className={classiCampo()} defaultValue={conti[0]?.id}>
              {conti.map((conto) => (
                <option key={conto.id} value={conto.id}>
                  {conto.nome}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="categoriaRendiconto">Categoria</Label>
            <select id="categoriaRendiconto" name="categoriaRendiconto" className={classiCampo()}>
              {categorie.map((categoria) => (
                <option key={categoria} value={categoria}>
                  {ETICHETTE_CATEGORIE_RENDICONTO[categoria]}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="causale">Causale</Label>
            <Input id="causale" name="causale" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="controparteFornitore">Controparte / fornitore (testo libero)</Label>
            <Input id="controparteFornitore" name="controparteFornitore" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="descrizione">Descrizione</Label>
            <Textarea id="descrizione" name="descrizione" rows={2} />
          </div>
          {tipo === "uscita" && (
            <div className="space-y-3 rounded-lg border border-warning/40 bg-warning/5 p-4">
              <div className="space-y-2">
                <Label htmlFor="giustificativo" className="flex items-center gap-1.5">
                  <Paperclip className="size-4" /> Allegato giustificativo
                </Label>
                <input
                  id="giustificativo"
                  name="giustificativo"
                  type="file"
                  accept="image/*,application/pdf"
                  className="text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Fattura, ricevuta o scontrino: da smartphone puoi scattare direttamente una foto,
                  oppure caricare un file già salvato (PDF o immagine).
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="motivazioneAssenzaGiustificativo">
                  Motivazione (se non si allega un giustificativo)
                </Label>
                <Textarea id="motivazioneAssenzaGiustificativo" name="motivazioneAssenzaGiustificativo" rows={2} />
              </div>
            </div>
          )}
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

function BottoneStorno({ movimentoId }: { movimentoId: string }) {
  const router = useRouter();
  const [aperto, setAperto] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<{ motivoStorno: string }>({ resolver: zodResolver(schemaStorno) });

  async function onSubmit(dati: { motivoStorno: string }) {
    const esito = await stornaMovimento(movimentoId, dati);
    if ("errore" in esito) {
      toast.error(esito.errore);
      return;
    }
    toast.success("Movimento stornato.");
    setAperto(false);
    router.refresh();
  }

  return (
    <Dialog open={aperto} onOpenChange={setAperto}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Storna
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Storna movimento</DialogTitle>
          <DialogDescription>
            Crea un movimento di segno opposto collegato all&apos;originale: nessuna cancellazione
            (§7.1).
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="space-y-2">
            <Label htmlFor="motivoStorno">Motivo</Label>
            <Textarea id="motivoStorno" rows={3} {...register("motivoStorno")} />
            {errors.motivoStorno && (
              <p className="text-sm text-destructive">{errors.motivoStorno.message}</p>
            )}
          </div>
          <DialogFooter>
            <Button type="submit" variant="destructive" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="animate-spin" />}
              Conferma storno
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function TabPrimaNota({
  movimenti,
  conti,
  puoScrivere,
}: {
  movimenti: MovimentoConRelazioni[];
  conti: Conto[];
  puoScrivere: boolean;
}) {
  // Un movimento già stornato non si può stornare di nuovo (§7.1): la
  // relazione stornoDiId è sull'entry di storno, quindi per nasconderne il
  // bottone sull'originale serve l'insieme degli id già referenziati.
  const idGiaStornati = new Set(movimenti.filter((m) => m.stornoDiId).map((m) => m.stornoDiId as string));

  return (
    <Card>
      <CardContent className="space-y-4 pt-6">
        {puoScrivere && (
          <div className="flex justify-end">
            <NuovoMovimentoDialog conti={conti} />
          </div>
        )}

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Causale</TableHead>
              <TableHead>Conto</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead className="text-right">Importo</TableHead>
              <TableHead className="text-right">Azioni</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {movimenti.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  Nessun movimento registrato.
                </TableCell>
              </TableRow>
            )}
            {movimenti.map((movimento) => (
              <TableRow key={movimento.id}>
                <TableCell>{new Intl.DateTimeFormat("it-IT").format(movimento.data)}</TableCell>
                <TableCell>
                  <Badge variant={movimento.tipo === "entrata" ? "success" : "secondary"}>
                    {movimento.tipo}
                  </Badge>
                </TableCell>
                <TableCell className="max-w-xs truncate">
                  {movimento.causale}
                  {movimento.stornoDiId && (
                    <span className="ml-1 text-xs text-muted-foreground">(storno)</span>
                  )}
                </TableCell>
                <TableCell>{movimento.conto.nome}</TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {ETICHETTE_CATEGORIE_RENDICONTO[movimento.categoriaRendiconto] ?? movimento.categoriaRendiconto}
                </TableCell>
                <TableCell className="text-right font-medium">
                  {movimento.tipo === "uscita" ? "-" : ""}
                  {formattaEuro(Number(movimento.importo))}
                </TableCell>
                <TableCell className="text-right">
                  {puoScrivere && !movimento.stornoDiId && !idGiaStornati.has(movimento.id) && (
                    <BottoneStorno movimentoId={movimento.id} />
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
