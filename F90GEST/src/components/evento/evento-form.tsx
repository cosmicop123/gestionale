"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  schemaEvento,
  TIPOLOGIE_EVENTO,
  ETICHETTE_TIPOLOGIE_EVENTO,
  TIPI_INGRESSO_EVENTO,
  ETICHETTE_TIPI_INGRESSO,
  type DatiEvento,
} from "@/lib/validazioni/evento";
import { creaEvento, modificaEvento } from "@/lib/evento/actions";

const oggi = () => new Date().toISOString().slice(0, 10);

function formattaDataInput(data: Date | null | undefined): string {
  return data ? new Date(data).toISOString().slice(0, 10) : "";
}

type EventoEsistente = {
  id: string;
  titolo: string;
  tipologia: string;
  dataInizio: Date;
  dataFine: Date | null;
  luogo: string | null;
  descrizione: string | null;
  tipoIngresso: string;
  capienza: number | null;
};

export function EventoForm({ evento }: { evento?: EventoEsistente }) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    control,
    formState: { isSubmitting, errors },
  } = useForm<DatiEvento>({
    resolver: zodResolver(schemaEvento),
    defaultValues: evento
      ? {
          titolo: evento.titolo,
          tipologia: evento.tipologia as DatiEvento["tipologia"],
          dataInizio: formattaDataInput(evento.dataInizio),
          dataFine: formattaDataInput(evento.dataFine),
          luogo: evento.luogo ?? "",
          descrizione: evento.descrizione ?? "",
          tipoIngresso: evento.tipoIngresso as DatiEvento["tipoIngresso"],
          capienza: evento.capienza ? String(evento.capienza) : "",
        }
      : {
          titolo: "",
          tipologia: "spettacolo",
          dataInizio: oggi(),
          dataFine: "",
          luogo: "",
          descrizione: "",
          tipoIngresso: "gratuito",
          capienza: "",
        },
  });

  async function onSubmit(dati: DatiEvento) {
    if (evento) {
      const esito = await modificaEvento(evento.id, dati);
      if ("errore" in esito) {
        toast.error(esito.errore);
        return;
      }
      toast.success("Evento aggiornato.");
      router.push(`/eventi/${evento.id}`);
      router.refresh();
      return;
    }

    const esito = await creaEvento(dati);
    if ("errore" in esito) {
      toast.error(esito.errore);
      return;
    }
    toast.success("Evento creato.");
    router.push(`/eventi/${esito.eventoId}`);
    router.refresh();
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="titolo">Titolo</Label>
              <Input id="titolo" {...register("titolo")} />
              {errors.titolo && <p className="text-sm text-destructive">{errors.titolo.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="tipologia">Tipologia</Label>
              <Controller
                control={control}
                name="tipologia"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="tipologia" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIPOLOGIE_EVENTO.map((t) => (
                        <SelectItem key={t} value={t}>
                          {ETICHETTE_TIPOLOGIE_EVENTO[t]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="luogo">Luogo</Label>
              <Input id="luogo" {...register("luogo")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dataInizio">Data di inizio</Label>
              <Input id="dataInizio" type="date" {...register("dataInizio")} />
              {errors.dataInizio && <p className="text-sm text-destructive">{errors.dataInizio.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="dataFine">Data di fine</Label>
              <Input id="dataFine" type="date" {...register("dataFine")} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="descrizione">Descrizione</Label>
              <Textarea id="descrizione" rows={3} {...register("descrizione")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tipoIngresso">Tipo di ingresso</Label>
              <Controller
                control={control}
                name="tipoIngresso"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="tipoIngresso" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIPI_INGRESSO_EVENTO.map((t) => (
                        <SelectItem key={t} value={t}>
                          {ETICHETTE_TIPI_INGRESSO[t]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="capienza">Capienza massima</Label>
              <Input id="capienza" type="number" min="1" {...register("capienza")} />
            </div>
          </div>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="animate-spin" />}
            {evento ? "Salva modifiche" : "Crea evento"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
