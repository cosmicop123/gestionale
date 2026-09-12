"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Lock, Plus } from "lucide-react";
import { toast } from "sonner";
import type { AnnoSociale } from "@prisma/client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  DialogClose,
} from "@/components/ui/dialog";
import { schemaAnnoSociale, type DatiAnnoSociale } from "@/lib/validazioni/anno-sociale";
import { creaAnnoSociale, chiudiAnnoSociale } from "@/lib/anno-sociale/actions";

function formattaData(data: Date): string {
  return new Intl.DateTimeFormat("it-IT").format(new Date(data));
}

export function TabAnniSociali({ anniSociali }: { anniSociali: AnnoSociale[] }) {
  const [dialogNuovoAperto, setDialogNuovoAperto] = useState(false);
  const [annoInChiusura, setAnnoInChiusura] = useState<AnnoSociale | null>(null);
  const [inAttesaChiusura, setInAttesaChiusura] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<DatiAnnoSociale>({ resolver: zodResolver(schemaAnnoSociale) });

  async function onCreaAnno(dati: DatiAnnoSociale) {
    const esito = await creaAnnoSociale(dati);
    if ("errore" in esito) {
      toast.error(esito.errore);
      return;
    }
    toast.success("Anno sociale creato.");
    reset();
    setDialogNuovoAperto(false);
  }

  async function confermaChiusura() {
    if (!annoInChiusura) return;
    setInAttesaChiusura(true);
    try {
      const esito = await chiudiAnnoSociale(annoInChiusura.id);
      if ("errore" in esito) {
        toast.error(esito.errore);
        return;
      }
      toast.success(`Anno sociale ${annoInChiusura.etichetta} chiuso.`);
      setAnnoInChiusura(null);
    } finally {
      setInAttesaChiusura(false);
    }
  }

  return (
    <Card>
      <CardContent className="space-y-4 pt-6">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Quote, tesseramenti e report contabili sono agganciati all&apos;anno sociale.
          </p>
          <Dialog open={dialogNuovoAperto} onOpenChange={setDialogNuovoAperto}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus /> Nuovo anno sociale
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nuovo anno sociale</DialogTitle>
                <DialogDescription>
                  Es. etichetta &quot;2027/2028&quot; con inizio 1° settembre e fine 31 agosto.
                </DialogDescription>
              </DialogHeader>
              <form className="space-y-4" onSubmit={handleSubmit(onCreaAnno)} noValidate>
                <div className="space-y-2">
                  <Label htmlFor="etichetta">Etichetta</Label>
                  <Input id="etichetta" placeholder="2027/2028" {...register("etichetta")} />
                  {errors.etichetta && (
                    <p className="text-sm text-destructive">{errors.etichetta.message}</p>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="dataInizio">Data inizio</Label>
                    <Input id="dataInizio" type="date" {...register("dataInizio")} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dataFine">Data fine</Label>
                    <Input id="dataFine" type="date" {...register("dataFine")} />
                  </div>
                </div>
                {errors.dataFine && (
                  <p className="text-sm text-destructive">{errors.dataFine.message}</p>
                )}
                <DialogFooter>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="animate-spin" />}
                    Crea
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Anno sociale</TableHead>
              <TableHead>Inizio</TableHead>
              <TableHead>Fine</TableHead>
              <TableHead>Stato</TableHead>
              <TableHead className="text-right">Azioni</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {anniSociali.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  Nessun anno sociale creato.
                </TableCell>
              </TableRow>
            )}
            {anniSociali.map((anno) => (
              <TableRow key={anno.id}>
                <TableCell className="font-medium">{anno.etichetta}</TableCell>
                <TableCell>{formattaData(anno.dataInizio)}</TableCell>
                <TableCell>{formattaData(anno.dataFine)}</TableCell>
                <TableCell>
                  {anno.chiuso ? (
                    <Badge variant="secondary">Chiuso</Badge>
                  ) : (
                    <Badge variant="success">Aperto</Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {!anno.chiuso && (
                    <Button variant="outline" size="sm" onClick={() => setAnnoInChiusura(anno)}>
                      <Lock /> Chiudi
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>

      <Dialog open={!!annoInChiusura} onOpenChange={(aperto) => !aperto && setAnnoInChiusura(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Chiudere l&apos;anno sociale {annoInChiusura?.etichetta}?</DialogTitle>
            <DialogDescription>
              Un anno sociale chiuso non può più essere riaperto da qui. I dati restano
              consultabili ma non sarà più possibile registrare nuovi tesseramenti o quote per
              questo anno.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Annulla</Button>
            </DialogClose>
            <Button variant="destructive" onClick={confermaChiusura} disabled={inAttesaChiusura}>
              {inAttesaChiusura && <Loader2 className="animate-spin" />}
              Conferma chiusura
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
