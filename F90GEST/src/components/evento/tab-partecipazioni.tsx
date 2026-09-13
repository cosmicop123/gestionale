"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Loader2, UserPlus, Trash2, Check, ScanLine, Wallet } from "lucide-react";
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
import { schemaPartecipazioneEvento, schemaIncassoEvento, type DatiPartecipazioneEvento, type DatiIncassoEvento } from "@/lib/validazioni/evento";
import { registraPartecipazione, rimuoviPartecipazione, registraCheckIn } from "@/lib/partecipazione-evento/actions";
import { registraIncassoEvento } from "@/lib/evento/actions";

type PersonaOpzione = { id: string; nome: string; cognome: string };
type ContoOpzione = { id: string; nome: string };
type PartecipazioneRiga = {
  id: string;
  persona: { nome: string; cognome: string } | null;
  nomeLibero: string | null;
  bigliettoOblazione: unknown;
  dataCheckIn: Date | null;
  checkInQr: boolean;
};

function formattaEuro(valore: number): string {
  return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(valore);
}

function DialogNuovaPartecipazione({ eventoId, persone }: { eventoId: string; persone: PersonaOpzione[] }) {
  const router = useRouter();
  const [aperto, setAperto] = useState(false);
  const { handleSubmit, control, register, formState: { errors, isSubmitting } } = useForm<DatiPartecipazioneEvento>({
    resolver: zodResolver(schemaPartecipazioneEvento),
    defaultValues: { personaId: "", nomeLibero: "", bigliettoOblazione: "" },
  });

  async function onSubmit(dati: DatiPartecipazioneEvento) {
    const esito = await registraPartecipazione(eventoId, dati);
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
          <UserPlus /> Aggiungi partecipante
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Aggiungi partecipante</DialogTitle>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="space-y-2">
            <Label htmlFor="personaId">Persona censita (facoltativo)</Label>
            <Controller
              control={control}
              name="personaId"
              render={({ field }) => (
                <Select value={field.value || undefined} onValueChange={field.onChange}>
                  <SelectTrigger id="personaId" className="w-full">
                    <SelectValue placeholder="Nessuna" />
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
            <Label htmlFor="nomeLibero">Nome (se non censito)</Label>
            <Input id="nomeLibero" {...register("nomeLibero")} />
            {errors.nomeLibero && <p className="text-sm text-destructive">{errors.nomeLibero.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="bigliettoOblazione">Biglietto/oblazione (€)</Label>
            <Input id="bigliettoOblazione" type="number" min="0" step="0.01" {...register("bigliettoOblazione")} />
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

function DialogIncasso({
  eventoId,
  conti,
  importoSuggerito,
}: {
  eventoId: string;
  conti: ContoOpzione[];
  importoSuggerito: number;
}) {
  const router = useRouter();
  const [aperto, setAperto] = useState(false);
  const { handleSubmit, control, register, reset, formState: { errors, isSubmitting } } = useForm<DatiIncassoEvento>({
    resolver: zodResolver(schemaIncassoEvento),
    defaultValues: {
      contoId: conti[0]?.id ?? "",
      importo: importoSuggerito > 0 ? importoSuggerito.toFixed(2) : "",
      data: new Date().toISOString().slice(0, 10),
      causale: "Incasso evento",
    },
  });

  // Il componente resta montato tra un'apertura e l'altra del dialog: senza
  // questo reset, l'importo suggerito resterebbe quello calcolato al primo
  // mount anche dopo che nuovi partecipanti hanno cambiato il totale.
  useEffect(() => {
    if (aperto) {
      reset({
        contoId: conti[0]?.id ?? "",
        importo: importoSuggerito > 0 ? importoSuggerito.toFixed(2) : "",
        data: new Date().toISOString().slice(0, 10),
        causale: "Incasso evento",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aperto]);

  async function onSubmit(dati: DatiIncassoEvento) {
    const esito = await registraIncassoEvento(eventoId, dati);
    if ("errore" in esito) {
      toast.error(esito.errore);
      return;
    }
    toast.success("Incasso registrato in prima nota.");
    setAperto(false);
    router.refresh();
  }

  return (
    <Dialog open={aperto} onOpenChange={setAperto}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" disabled={conti.length === 0}>
          <Wallet /> Registra incasso
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registra l&apos;incasso dell&apos;evento</DialogTitle>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="space-y-2">
            <Label htmlFor="contoId">Conto di destinazione</Label>
            <Controller
              control={control}
              name="contoId"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="contoId" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {conti.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="importo">Importo (€)</Label>
            <Input id="importo" type="number" min="0" step="0.01" {...register("importo")} />
            {errors.importo && <p className="text-sm text-destructive">{errors.importo.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="data">Data</Label>
            <Input id="data" type="date" {...register("data")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="causale">Causale</Label>
            <Input id="causale" {...register("causale")} />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="animate-spin" />}
              Registra
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function TabPartecipazioni({
  evento,
  partecipazioni,
  persone,
  conti,
  puoGestire,
  puoIncassare,
}: {
  evento: { id: string; tipoIngresso: string };
  partecipazioni: PartecipazioneRiga[];
  persone: PersonaOpzione[];
  conti: ContoOpzione[];
  puoGestire: boolean;
  puoIncassare: boolean;
}) {
  const router = useRouter();
  const totaleBiglietti = partecipazioni.reduce((s, p) => s + Number(p.bigliettoOblazione ?? 0), 0);

  async function onCheckIn(partecipazioneId: string) {
    const esito = await registraCheckIn(evento.id, partecipazioneId);
    if ("errore" in esito) {
      toast.error(esito.errore);
      return;
    }
    router.refresh();
  }

  async function onRimuovi(partecipazioneId: string) {
    const esito = await rimuoviPartecipazione(evento.id, partecipazioneId);
    if ("errore" in esito) {
      toast.error(esito.errore);
      return;
    }
    router.refresh();
  }

  return (
    <Card>
      <CardContent className="space-y-4 pt-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            {partecipazioni.length} partecipanti
            {evento.tipoIngresso !== "gratuito" ? ` · ${formattaEuro(totaleBiglietti)} dichiarati` : ""}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/eventi/${evento.id}/check-in`}>
                <ScanLine /> Check-in
              </Link>
            </Button>
            {puoIncassare && evento.tipoIngresso !== "gratuito" && (
              <DialogIncasso eventoId={evento.id} conti={conti} importoSuggerito={totaleBiglietti} />
            )}
            {puoGestire && <DialogNuovaPartecipazione eventoId={evento.id} persone={persone} />}
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead className="text-right">Biglietto/oblazione</TableHead>
              <TableHead>Check-in</TableHead>
              {puoGestire && <TableHead className="text-right">Azioni</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {partecipazioni.length === 0 && (
              <TableRow>
                <TableCell colSpan={puoGestire ? 4 : 3} className="text-center text-muted-foreground">
                  Nessun partecipante registrato.
                </TableCell>
              </TableRow>
            )}
            {partecipazioni.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="font-medium">
                  {p.persona ? `${p.persona.cognome} ${p.persona.nome}` : p.nomeLibero}
                </TableCell>
                <TableCell className="text-right">
                  {p.bigliettoOblazione ? formattaEuro(Number(p.bigliettoOblazione)) : "—"}
                </TableCell>
                <TableCell>
                  {p.dataCheckIn ? (
                    <Badge variant="success">
                      {p.checkInQr ? "QR" : "Manuale"} ·{" "}
                      {new Intl.DateTimeFormat("it-IT", { timeStyle: "short" }).format(p.dataCheckIn)}
                    </Badge>
                  ) : puoGestire ? (
                    <Button variant="outline" size="sm" onClick={() => onCheckIn(p.id)}>
                      <Check /> Check-in
                    </Button>
                  ) : (
                    <Badge variant="outline">Non presente</Badge>
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
