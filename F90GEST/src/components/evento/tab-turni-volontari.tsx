"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  schemaTurnoVolontario,
  STATI_TURNO_VOLONTARIO,
  ETICHETTE_STATI_TURNO,
  type DatiTurnoVolontario,
} from "@/lib/validazioni/evento";
import { proponiTurnoVolontario, cambiaStatoTurnoVolontario, rimuoviTurnoVolontario } from "@/lib/turno-volontario/actions";

type PersonaOpzione = { id: string; nome: string; cognome: string };
type TurnoRiga = {
  id: string;
  volontario: { nome: string; cognome: string };
  mansione: string;
  oraInizio: string | null;
  oraFine: string | null;
  stato: string;
};

function DialogNuovoTurno({ eventoId, persone }: { eventoId: string; persone: PersonaOpzione[] }) {
  const router = useRouter();
  const [aperto, setAperto] = useState(false);
  const { handleSubmit, control, register, formState: { errors, isSubmitting } } = useForm<DatiTurnoVolontario>({
    resolver: zodResolver(schemaTurnoVolontario),
    defaultValues: { volontarioId: "", mansione: "", oraInizio: "", oraFine: "" },
  });

  async function onSubmit(dati: DatiTurnoVolontario) {
    const esito = await proponiTurnoVolontario(eventoId, dati);
    if ("errore" in esito) {
      toast.error(esito.errore);
      return;
    }
    toast.success("Turno proposto.");
    setAperto(false);
    router.refresh();
  }

  return (
    <Dialog open={aperto} onOpenChange={setAperto}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus /> Proponi turno
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Proponi un turno volontario</DialogTitle>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="space-y-2">
            <Label htmlFor="volontarioId">Volontario</Label>
            <Controller
              control={control}
              name="volontarioId"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="volontarioId" className="w-full">
                    <SelectValue placeholder="Seleziona una persona" />
                  </SelectTrigger>
                  <SelectContent>
                    {persone.map((persona) => (
                      <SelectItem key={persona.id} value={persona.id}>
                        {persona.cognome} {persona.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="mansione">Mansione</Label>
            <Input id="mansione" {...register("mansione")} />
            {errors.mansione && <p className="text-sm text-destructive">{errors.mansione.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="oraInizio">Ora inizio</Label>
              <Input id="oraInizio" type="time" {...register("oraInizio")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="oraFine">Ora fine</Label>
              <Input id="oraFine" type="time" {...register("oraFine")} />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="animate-spin" />}
              Proponi
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function TabTurniVolontari({
  eventoId,
  turni,
  persone,
  puoGestire,
}: {
  eventoId: string;
  turni: TurnoRiga[];
  persone: PersonaOpzione[];
  puoGestire: boolean;
}) {
  const router = useRouter();

  async function onCambiaStato(turnoId: string, stato: (typeof STATI_TURNO_VOLONTARIO)[number]) {
    const esito = await cambiaStatoTurnoVolontario(eventoId, turnoId, stato);
    if ("errore" in esito) {
      toast.error(esito.errore);
      return;
    }
    router.refresh();
  }

  async function onRimuovi(turnoId: string) {
    const esito = await rimuoviTurnoVolontario(eventoId, turnoId);
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
            <DialogNuovoTurno eventoId={eventoId} persone={persone} />
          </div>
        )}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Volontario</TableHead>
              <TableHead>Mansione</TableHead>
              <TableHead>Orario</TableHead>
              <TableHead>Stato</TableHead>
              {puoGestire && <TableHead className="text-right">Azioni</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {turni.length === 0 && (
              <TableRow>
                <TableCell colSpan={puoGestire ? 5 : 4} className="text-center text-muted-foreground">
                  Nessun turno proposto.
                </TableCell>
              </TableRow>
            )}
            {turni.map((turno) => (
              <TableRow key={turno.id}>
                <TableCell className="font-medium">
                  {turno.volontario.cognome} {turno.volontario.nome}
                </TableCell>
                <TableCell>{turno.mansione}</TableCell>
                <TableCell className="text-muted-foreground">
                  {turno.oraInizio && turno.oraFine ? `${turno.oraInizio}–${turno.oraFine}` : "—"}
                </TableCell>
                <TableCell>
                  {puoGestire ? (
                    <Select value={turno.stato} onValueChange={(v) => onCambiaStato(turno.id, v as (typeof STATI_TURNO_VOLONTARIO)[number])}>
                      <SelectTrigger size="sm" className="w-36">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATI_TURNO_VOLONTARIO.map((s) => (
                          <SelectItem key={s} value={s}>
                            {ETICHETTE_STATI_TURNO[s]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    ETICHETTE_STATI_TURNO[turno.stato as (typeof STATI_TURNO_VOLONTARIO)[number]] ?? turno.stato
                  )}
                </TableCell>
                {puoGestire && (
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => onRimuovi(turno.id)}>
                      <Trash2 className="text-destructive" />
                    </Button>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
