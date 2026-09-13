"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Loader2, Plus, ClipboardList, FileText } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  schemaLezioneManuale,
  STATI_LEZIONE,
  ETICHETTE_STATI_LEZIONE,
  type DatiLezioneManuale,
} from "@/lib/validazioni/corso";
import { aggiungiLezioneManuale, modificaLezione } from "@/lib/corso/actions";

type PersonaOpzione = { id: string; nome: string; cognome: string };
type LezioneRiga = {
  id: string;
  numeroProgressivo: number;
  titolo: string | null;
  data: Date;
  oraInizio: string;
  oraFine: string;
  durataOre: unknown;
  stato: string;
  noteDocente: string | null;
  docenteEffettivo: { nome: string; cognome: string } | null;
};

const VARIANTE_STATO_LEZIONE: Record<string, "success" | "warning" | "secondary" | "outline" | "destructive"> = {
  programmata: "outline",
  svolta: "success",
  rinviata: "warning",
  annullata: "destructive",
};

function DialogNuovaLezione({ corsoId, docenti }: { corsoId: string; docenti: PersonaOpzione[] }) {
  const router = useRouter();
  const [aperto, setAperto] = useState(false);
  const {
    register,
    handleSubmit,
    control,
    formState: { isSubmitting, errors },
  } = useForm<DatiLezioneManuale>({
    resolver: zodResolver(schemaLezioneManuale),
    defaultValues: {
      titolo: "",
      argomenti: "",
      data: new Date().toISOString().slice(0, 10),
      oraInizio: "",
      oraFine: "",
      durataOre: "",
      aulaSede: "",
      docenteEffettivoId: "",
    },
  });

  async function onSubmit(dati: DatiLezioneManuale) {
    const esito = await aggiungiLezioneManuale(corsoId, dati);
    if ("errore" in esito) {
      toast.error(esito.errore);
      return;
    }
    toast.success("Lezione aggiunta.");
    setAperto(false);
    router.refresh();
  }

  return (
    <Dialog open={aperto} onOpenChange={setAperto}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus /> Aggiungi lezione
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Aggiungi lezione</DialogTitle>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="space-y-2">
            <Label htmlFor="titolo">Titolo (facoltativo)</Label>
            <Input id="titolo" {...register("titolo")} />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="data">Data</Label>
              <Input id="data" type="date" {...register("data")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="oraInizio">Ora inizio</Label>
              <Input id="oraInizio" type="time" {...register("oraInizio")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="oraFine">Ora fine</Label>
              <Input id="oraFine" type="time" {...register("oraFine")} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="durataOre">Durata (ore)</Label>
            <Input id="durataOre" type="number" min="0.5" step="0.5" {...register("durataOre")} />
            {errors.durataOre && <p className="text-sm text-destructive">{errors.durataOre.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="aulaSede">Aula / sede</Label>
            <Input id="aulaSede" {...register("aulaSede")} />
          </div>
          {docenti.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="docenteEffettivoId">Docente effettivo</Label>
              <Controller
                control={control}
                name="docenteEffettivoId"
                render={({ field }) => (
                  <Select value={field.value || undefined} onValueChange={field.onChange}>
                    <SelectTrigger id="docenteEffettivoId" className="w-full">
                      <SelectValue placeholder="Nessuno" />
                    </SelectTrigger>
                    <SelectContent>
                      {docenti.map((d) => (
                        <SelectItem key={d.id} value={d.id}>
                          {d.cognome} {d.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          )}
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="animate-spin" />}
              Aggiungi
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function SelettoreStatoLezione({ lezioneId, stato }: { lezioneId: string; stato: string }) {
  const router = useRouter();

  async function onChange(nuovoStato: string) {
    const esito = await modificaLezione(lezioneId, { stato: nuovoStato as (typeof STATI_LEZIONE)[number], noteDocente: "" });
    if ("errore" in esito) {
      toast.error(esito.errore);
      return;
    }
    router.refresh();
  }

  return (
    <Select value={stato} onValueChange={onChange}>
      <SelectTrigger size="sm" className="w-40">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {STATI_LEZIONE.map((s) => (
          <SelectItem key={s} value={s}>
            {ETICHETTE_STATI_LEZIONE[s]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function TabLezioni({
  corsoId,
  lezioni,
  docenti,
  puoGestire,
  puoFareAppello,
}: {
  corsoId: string;
  lezioni: LezioneRiga[];
  docenti: PersonaOpzione[];
  puoGestire: boolean;
  puoFareAppello: boolean;
}) {
  return (
    <Card>
      <CardContent className="space-y-4 pt-6">
        {puoGestire && (
          <div className="flex justify-end">
            <DialogNuovaLezione corsoId={corsoId} docenti={docenti} />
          </div>
        )}

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>N.</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Orario</TableHead>
              <TableHead>Docente</TableHead>
              <TableHead>Stato</TableHead>
              <TableHead className="text-right">Azioni</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {lezioni.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  Nessuna lezione in calendario.
                </TableCell>
              </TableRow>
            )}
            {lezioni.map((lezione) => (
              <TableRow key={lezione.id}>
                <TableCell>{lezione.numeroProgressivo}</TableCell>
                <TableCell>{new Intl.DateTimeFormat("it-IT").format(lezione.data)}</TableCell>
                <TableCell className="text-muted-foreground">
                  {lezione.oraInizio}–{lezione.oraFine}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {lezione.docenteEffettivo
                    ? `${lezione.docenteEffettivo.cognome} ${lezione.docenteEffettivo.nome}`
                    : "—"}
                </TableCell>
                <TableCell>
                  {puoGestire || puoFareAppello ? (
                    <SelettoreStatoLezione lezioneId={lezione.id} stato={lezione.stato} />
                  ) : (
                    <Badge variant={VARIANTE_STATO_LEZIONE[lezione.stato] ?? "outline"}>
                      {ETICHETTE_STATI_LEZIONE[lezione.stato as keyof typeof ETICHETTE_STATI_LEZIONE] ?? lezione.stato}
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    {puoFareAppello && (
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/corsi/${corsoId}/lezioni/${lezione.id}/appello`}>
                          <ClipboardList /> Appello
                        </Link>
                      </Button>
                    )}
                    <Button variant="outline" size="sm" asChild>
                      <a href={`/corsi/${corsoId}/lezioni/${lezione.id}/registro/pdf`} target="_blank" rel="noopener noreferrer">
                        <FileText /> Registro
                      </a>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
