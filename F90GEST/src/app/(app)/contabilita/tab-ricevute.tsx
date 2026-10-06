"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { Loader2, FileText, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import type { Ricevuta } from "@prisma/client";

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
import { annullaRicevuta, azzeraNumerazioneRicevute } from "@/lib/ricevuta/actions";

type RicevutaConIntestatario = Ricevuta & { intestatario: { nome: string; cognome: string } };

const schemaMotivo = z.object({ motivo: z.string().min(1, "Inserire il motivo dell'annullamento.") });

function formattaEuro(valore: number): string {
  return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(valore);
}

/**
 * Corregge la numerazione quando un'associazione inizia a usare il
 * gestionale avendo già emesso ricevute "a mano" nello stesso anno solare:
 * annulla in blocco quelle già presenti nel gestionale per l'anno scelto
 * (mai una cancellazione reale, §7.4) e imposta il prossimo numero da
 * assegnare. Form nativo + FormData (non react-hook-form), stesso pattern
 * già usato per il ripristino da backup: un'azione distruttiva protetta
 * da una frase di conferma digitata, non da un singolo click.
 */
function DialogAzzeraNumerazione() {
  const router = useRouter();
  const [aperto, setAperto] = useState(false);
  const [inCorso, setInCorso] = useState(false);
  const annoCorrente = new Date().getFullYear();

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setInCorso(true);
    const formData = new FormData(e.currentTarget);
    const esito = await azzeraNumerazioneRicevute(formData);
    setInCorso(false);
    if ("errore" in esito) {
      toast.error(esito.errore);
      return;
    }
    toast.success(esito.messaggio);
    setAperto(false);
    router.refresh();
  }

  return (
    <Dialog open={aperto} onOpenChange={setAperto}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm">
          <AlertTriangle /> Correggi numerazione
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Correggi la numerazione delle ricevute</DialogTitle>
          <DialogDescription>
            Usa questa funzione solo se hai già emesso ricevute fuori dal gestionale nello stesso anno
            (es. a mano, su carta) prima di iniziare a usarlo: le ricevute già registrate nel gestionale
            per l&apos;anno scelto verranno <strong>annullate in blocco</strong> (restano nello storico
            con la filigrana &quot;ANNULLATA&quot;, non vengono cancellate — §7.4) e la numerazione
            riparte dal numero che indichi.
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="annoSolare">Anno solare</Label>
              <Input id="annoSolare" name="annoSolare" type="number" defaultValue={annoCorrente} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="prossimoNumero">Prossimo numero da assegnare</Label>
              <Input id="prossimoNumero" name="prossimoNumero" type="number" min={1} required />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="conferma">
              Digita <code>AZZERA</code> per confermare
            </Label>
            <Input id="conferma" name="conferma" autoComplete="off" required />
          </div>
          <DialogFooter>
            <Button type="submit" variant="destructive" disabled={inCorso}>
              {inCorso && <Loader2 className="animate-spin" />}
              Conferma
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function TabRicevute({
  ricevute,
  puoScrivere,
  isAmministratore,
}: {
  ricevute: RicevutaConIntestatario[];
  puoScrivere: boolean;
  isAmministratore: boolean;
}) {
  const router = useRouter();
  const [ricevutaDaAnnullare, setRicevutaDaAnnullare] = useState<RicevutaConIntestatario | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<{ motivo: string }>({ resolver: zodResolver(schemaMotivo) });

  async function onAnnulla(dati: { motivo: string }) {
    if (!ricevutaDaAnnullare) return;
    const esito = await annullaRicevuta(ricevutaDaAnnullare.id, dati);
    if ("errore" in esito) {
      toast.error(esito.errore);
      return;
    }
    toast.success("Ricevuta annullata.");
    setRicevutaDaAnnullare(null);
    router.refresh();
  }

  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        {isAmministratore && (
          <div className="flex justify-end">
            <DialogAzzeraNumerazione />
          </div>
        )}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Numero</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Intestatario</TableHead>
              <TableHead>Causale</TableHead>
              <TableHead className="text-right">Importo</TableHead>
              <TableHead>Stato</TableHead>
              <TableHead className="text-right">Azioni</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ricevute.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  Nessuna ricevuta emessa.
                </TableCell>
              </TableRow>
            )}
            {ricevute.map((ricevuta) => (
              <TableRow key={ricevuta.id}>
                <TableCell className="font-medium">
                  {ricevuta.numero}/{ricevuta.annoSolare}
                </TableCell>
                <TableCell>{new Intl.DateTimeFormat("it-IT").format(ricevuta.data)}</TableCell>
                <TableCell>
                  {ricevuta.intestatario.cognome} {ricevuta.intestatario.nome}
                </TableCell>
                <TableCell className="max-w-xs truncate">{ricevuta.causale}</TableCell>
                <TableCell className="text-right">{formattaEuro(Number(ricevuta.importo))}</TableCell>
                <TableCell>
                  <Badge variant={ricevuta.stato === "annullata" ? "destructive" : "success"}>
                    {ricevuta.stato}
                  </Badge>
                </TableCell>
                <TableCell className="text-right space-x-2">
                  <Button variant="outline" size="sm" asChild>
                    <a href={`/contabilita/ricevute/${ricevuta.id}/pdf`} target="_blank" rel="noopener noreferrer">
                      <FileText /> PDF
                    </a>
                  </Button>
                  {puoScrivere && ricevuta.stato !== "annullata" && (
                    <Button variant="outline" size="sm" onClick={() => setRicevutaDaAnnullare(ricevuta)}>
                      Annulla
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>

      <Dialog open={!!ricevutaDaAnnullare} onOpenChange={(aperto) => !aperto && setRicevutaDaAnnullare(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Annullare la ricevuta {ricevutaDaAnnullare?.numero}/{ricevutaDaAnnullare?.annoSolare}?
            </DialogTitle>
            <DialogDescription>
              La ricevuta non viene cancellata: resta nello storico con lo stato &quot;annullata&quot; e il
              motivo indicato (§7.4).
            </DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={handleSubmit(onAnnulla)} noValidate>
            <div className="space-y-2">
              <Label htmlFor="motivo">Motivo</Label>
              <Textarea id="motivo" rows={3} {...register("motivo")} />
              {errors.motivo && <p className="text-sm text-destructive">{errors.motivo.message}</p>}
            </div>
            <DialogFooter>
              <Button type="submit" variant="destructive" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="animate-spin" />}
                Conferma annullamento
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
