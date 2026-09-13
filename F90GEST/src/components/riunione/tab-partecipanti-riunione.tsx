"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Loader2, UserPlus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
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
import { schemaPartecipanteRiunione, type DatiPartecipanteRiunione } from "@/lib/validazioni/riunione";
import {
  aggiungiPartecipanteRiunione,
  segnaPresenzaRiunione,
  rimuoviPartecipanteRiunione,
} from "@/lib/riunione/actions";

type PersonaOpzione = { id: string; nome: string; cognome: string };
type PartecipanteRiga = {
  id: string;
  persona: { nome: string; cognome: string };
  convocato: boolean;
  presente: boolean;
  delegatoDa: { nome: string; cognome: string } | null;
};

function DialogNuovoPartecipante({ riunioneId, persone }: { riunioneId: string; persone: PersonaOpzione[] }) {
  const router = useRouter();
  const [aperto, setAperto] = useState(false);
  const { handleSubmit, control, formState: { isSubmitting } } = useForm<DatiPartecipanteRiunione>({
    resolver: zodResolver(schemaPartecipanteRiunione),
    defaultValues: { personaId: "", convocato: true, delegatoDaId: "" },
  });

  async function onSubmit(dati: DatiPartecipanteRiunione) {
    const esito = await aggiungiPartecipanteRiunione(riunioneId, dati);
    if ("errore" in esito) {
      toast.error(esito.errore);
      return;
    }
    toast.success("Partecipante aggiunto.");
    setAperto(false);
    router.refresh();
  }

  return (
    <Dialog open={aperto} onOpenChange={setAperto}>
      <DialogTrigger asChild>
        <Button size="sm">
          <UserPlus /> Aggiungi convocato
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Aggiungi un convocato</DialogTitle>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="space-y-2">
            <Label htmlFor="personaId">Persona</Label>
            <Controller
              control={control}
              name="personaId"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="personaId" className="w-full">
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
          <Controller
            control={control}
            name="convocato"
            render={({ field }) => (
              <label className="flex items-center gap-2 text-sm">
                <Checkbox checked={field.value} onCheckedChange={(v) => field.onChange(v === true)} />
                Regolarmente convocato
              </label>
            )}
          />
          <div className="space-y-2">
            <Label htmlFor="delegatoDaId">Con delega di (facoltativo)</Label>
            <Controller
              control={control}
              name="delegatoDaId"
              render={({ field }) => (
                <Select value={field.value || undefined} onValueChange={field.onChange}>
                  <SelectTrigger id="delegatoDaId" className="w-full">
                    <SelectValue placeholder="Nessuna delega" />
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

export function TabPartecipantiRiunione({
  riunioneId,
  partecipanti,
  persone,
  puoGestire,
}: {
  riunioneId: string;
  partecipanti: PartecipanteRiga[];
  persone: PersonaOpzione[];
  puoGestire: boolean;
}) {
  const router = useRouter();

  async function onTogglePresenza(partecipanteId: string, presente: boolean) {
    const esito = await segnaPresenzaRiunione(riunioneId, partecipanteId, presente);
    if ("errore" in esito) {
      toast.error(esito.errore);
      return;
    }
    router.refresh();
  }

  async function onRimuovi(partecipanteId: string) {
    const esito = await rimuoviPartecipanteRiunione(riunioneId, partecipanteId);
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
            <DialogNuovoPartecipante riunioneId={riunioneId} persone={persone} />
          </div>
        )}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Convocato</TableHead>
              <TableHead>Presente</TableHead>
              {puoGestire && <TableHead className="text-right">Azioni</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {partecipanti.length === 0 && (
              <TableRow>
                <TableCell colSpan={puoGestire ? 4 : 3} className="text-center text-muted-foreground">
                  Nessun convocato registrato.
                </TableCell>
              </TableRow>
            )}
            {partecipanti.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="font-medium">
                  {p.persona.cognome} {p.persona.nome}
                  {p.delegatoDa && (
                    <span className="ml-1 text-xs text-muted-foreground">
                      (delega di {p.delegatoDa.cognome} {p.delegatoDa.nome})
                    </span>
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground">{p.convocato ? "Sì" : "No"}</TableCell>
                <TableCell>
                  {puoGestire ? (
                    <Checkbox checked={p.presente} onCheckedChange={(v) => onTogglePresenza(p.id, v === true)} />
                  ) : p.presente ? (
                    "Sì"
                  ) : (
                    "No"
                  )}
                </TableCell>
                {puoGestire && (
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => onRimuovi(p.id)}>
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
