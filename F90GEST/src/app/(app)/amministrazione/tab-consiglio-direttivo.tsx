"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Loader2, UserPlus, Trash2, CalendarOff } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  schemaNominaCaricaSociale,
  schemaTerminaMandatoCaricaSociale,
  RUOLI_CARICA_SOCIALE,
  type DatiNominaCaricaSociale,
  type DatiTerminaMandatoCaricaSociale,
} from "@/lib/validazioni/carica-sociale";
import { nominaCaricaSociale, terminaMandatoCaricaSociale, eliminaCaricaSociale } from "@/lib/carica-sociale/actions";

type PersonaOpzione = { id: string; nome: string; cognome: string };
type CaricaRiga = {
  id: string;
  ruolo: string;
  persona: { id: string; nome: string; cognome: string };
  dataInizioMandato: string;
  dataFineMandato: string | null;
};

function formattaData(iso: string): string {
  return new Intl.DateTimeFormat("it-IT").format(new Date(iso));
}

function DialogNominaCarica({ ruolo, persone }: { ruolo: (typeof RUOLI_CARICA_SOCIALE)[number]; persone: PersonaOpzione[] }) {
  const router = useRouter();
  const [aperto, setAperto] = useState(false);
  const oggi = new Date().toISOString().slice(0, 10);
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<DatiNominaCaricaSociale>({
    resolver: zodResolver(schemaNominaCaricaSociale),
    defaultValues: { personaId: "", ruolo, dataInizioMandato: oggi, estremiVerbaleNomina: "" },
  });

  async function onSubmit(dati: DatiNominaCaricaSociale) {
    const esito = await nominaCaricaSociale({ ...dati, ruolo });
    if ("errore" in esito) {
      toast.error(esito.errore);
      return;
    }
    toast.success("Carica assegnata.");
    setAperto(false);
    router.refresh();
  }

  return (
    <Dialog open={aperto} onOpenChange={setAperto}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <UserPlus /> Nomina {ruolo.toLowerCase()}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nomina {ruolo.toLowerCase()}</DialogTitle>
          <DialogDescription>
            {ruolo === "Consigliere"
              ? "Si aggiunge ai consiglieri eventualmente già in carica."
              : "Il titolare attualmente in carica per questo ruolo, se presente, viene chiuso automaticamente alla data di inizio indicata."}
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
          <input type="hidden" {...register("ruolo")} />
          <div className="space-y-2">
            <Label htmlFor={`personaId-${ruolo}`}>Persona</Label>
            <Controller
              control={control}
              name="personaId"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id={`personaId-${ruolo}`} className="w-full">
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
            {errors.personaId && <p className="text-sm text-destructive">{errors.personaId.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor={`dataInizioMandato-${ruolo}`}>Data inizio mandato</Label>
            <Input id={`dataInizioMandato-${ruolo}`} type="date" {...register("dataInizioMandato")} />
            {errors.dataInizioMandato && <p className="text-sm text-destructive">{errors.dataInizioMandato.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor={`estremiVerbaleNomina-${ruolo}`}>Estremi verbale di nomina (facoltativo)</Label>
            <Input
              id={`estremiVerbaleNomina-${ruolo}`}
              placeholder="es. Verbale assemblea del 12/01/2026"
              {...register("estremiVerbaleNomina")}
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="animate-spin" />}
              Nomina
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DialogTerminaMandato({ carica }: { carica: CaricaRiga }) {
  const router = useRouter();
  const [aperto, setAperto] = useState(false);
  const oggi = new Date().toISOString().slice(0, 10);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<DatiTerminaMandatoCaricaSociale>({
    resolver: zodResolver(schemaTerminaMandatoCaricaSociale),
    defaultValues: { dataFineMandato: oggi },
  });

  async function onSubmit(dati: DatiTerminaMandatoCaricaSociale) {
    const esito = await terminaMandatoCaricaSociale(carica.id, dati);
    if ("errore" in esito) {
      toast.error(esito.errore);
      return;
    }
    toast.success("Mandato terminato.");
    setAperto(false);
    router.refresh();
  }

  return (
    <Dialog open={aperto} onOpenChange={setAperto}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <CalendarOff /> Termina mandato
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Terminare il mandato di {carica.persona.cognome} {carica.persona.nome} ({carica.ruolo.toLowerCase()})?
          </DialogTitle>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="space-y-2">
            <Label htmlFor="dataFineMandato">Data fine mandato</Label>
            <Input id="dataFineMandato" type="date" {...register("dataFineMandato")} />
            {errors.dataFineMandato && <p className="text-sm text-destructive">{errors.dataFineMandato.message}</p>}
          </div>
          <DialogFooter>
            <Button type="submit" variant="destructive" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="animate-spin" />}
              Conferma
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function TabConsiglioDirettivo({ righe, persone }: { righe: CaricaRiga[]; persone: PersonaOpzione[] }) {
  const router = useRouter();

  async function onElimina(caricaId: string) {
    const esito = await eliminaCaricaSociale(caricaId);
    if ("errore" in esito) {
      toast.error(esito.errore);
      return;
    }
    toast.success("Riga eliminata.");
    router.refresh();
  }

  const attuali = righe.filter((r) => !r.dataFineMandato);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Composizione attuale</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {RUOLI_CARICA_SOCIALE.map((ruolo) => {
            const titolari = attuali.filter((r) => r.ruolo === ruolo);
            return (
              <div key={ruolo} className="flex flex-wrap items-start justify-between gap-2 border-b pb-3 last:border-b-0 last:pb-0">
                <div className="space-y-1">
                  <p className="text-sm font-medium">{ruolo}</p>
                  {titolari.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nessun titolare assegnato.</p>
                  ) : (
                    titolari.map((t) => (
                      <div key={t.id} className="flex items-center gap-2 text-sm">
                        <span>
                          {t.persona.cognome} {t.persona.nome}
                        </span>
                        <span className="text-xs text-muted-foreground">dal {formattaData(t.dataInizioMandato)}</span>
                        <DialogTerminaMandato carica={t} />
                      </div>
                    ))
                  )}
                </div>
                <DialogNominaCarica ruolo={ruolo} persone={persone} />
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Storico cariche</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ruolo</TableHead>
                <TableHead>Persona</TableHead>
                <TableHead>Dal</TableHead>
                <TableHead>Al</TableHead>
                <TableHead>Stato</TableHead>
                <TableHead className="text-right">Azioni</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {righe.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    Nessuna carica registrata.
                  </TableCell>
                </TableRow>
              )}
              {righe.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>{r.ruolo}</TableCell>
                  <TableCell>
                    {r.persona.cognome} {r.persona.nome}
                  </TableCell>
                  <TableCell>{formattaData(r.dataInizioMandato)}</TableCell>
                  <TableCell>{r.dataFineMandato ? formattaData(r.dataFineMandato) : "—"}</TableCell>
                  <TableCell>
                    <Badge variant={r.dataFineMandato ? "outline" : "success"}>
                      {r.dataFineMandato ? "Concluso" : "In carica"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" title="Elimina (correzione di un inserimento errato)" onClick={() => onElimina(r.id)}>
                      <Trash2 className="text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
