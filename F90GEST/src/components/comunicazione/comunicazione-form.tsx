"use client";

import { useState } from "react";
import { useForm, useWatch, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Loader2, Send } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  schemaComunicazione,
  SEGMENTI_COMUNICAZIONE,
  ETICHETTE_SEGMENTI_COMUNICAZIONE,
  VARIABILI_TEMPLATE_PER_SEGMENTO,
  type DatiComunicazione,
} from "@/lib/validazioni/comunicazione";
import { creaComunicazione } from "@/lib/comunicazione/actions";

type CorsoOpzione = { id: string; titolo: string };
type PersonaOpzione = { id: string; nome: string; cognome: string; email: string | null };

export function ComunicazioneForm({ corsi, persone }: { corsi: CorsoOpzione[]; persone: PersonaOpzione[] }) {
  const router = useRouter();
  const [inAttesa, setInAttesa] = useState(false);
  const {
    handleSubmit,
    control,
    register,
    setValue,
    formState: { errors },
  } = useForm<DatiComunicazione>({
    resolver: zodResolver(schemaComunicazione),
    defaultValues: {
      titolo: "",
      segmento: "soci_attivi",
      corsoId: "",
      personaIds: [],
      templateOggetto: "",
      templateCorpo: "",
    },
  });

  const segmento = useWatch({ control, name: "segmento" });
  const personaIdsSelezionati = useWatch({ control, name: "personaIds" }) ?? [];

  function alternaPersona(personaId: string, selezionata: boolean) {
    const attuali = personaIdsSelezionati;
    setValue("personaIds", selezionata ? [...attuali, personaId] : attuali.filter((id) => id !== personaId));
  }

  async function onSubmit(dati: DatiComunicazione) {
    setInAttesa(true);
    const esito = await creaComunicazione(dati);
    setInAttesa(false);
    if ("errore" in esito) {
      toast.error(esito.errore);
      return;
    }
    toast.success("Comunicazione creata come bozza.");
    router.push(`/comunicazioni/${esito.comunicazioneId}`);
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form className="space-y-5" onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="space-y-2">
            <Label htmlFor="titolo">Titolo (uso interno)</Label>
            <Input id="titolo" {...register("titolo")} />
            {errors.titolo && <p className="text-sm text-destructive">{errors.titolo.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="segmento">Destinatari</Label>
            <Controller
              control={control}
              name="segmento"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="segmento" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SEGMENTI_COMUNICAZIONE.map((s) => (
                      <SelectItem key={s} value={s}>
                        {ETICHETTE_SEGMENTI_COMUNICAZIONE[s]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.segmento && <p className="text-sm text-destructive">{errors.segmento.message}</p>}
          </div>

          {segmento === "iscritti_corso" && (
            <div className="space-y-2">
              <Label htmlFor="corsoId">Corso</Label>
              <Controller
                control={control}
                name="corsoId"
                render={({ field }) => (
                  <Select value={field.value || undefined} onValueChange={field.onChange}>
                    <SelectTrigger id="corsoId" className="w-full">
                      <SelectValue placeholder="Seleziona un corso" />
                    </SelectTrigger>
                    <SelectContent>
                      {corsi.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.titolo}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.corsoId && <p className="text-sm text-destructive">{errors.corsoId.message}</p>}
            </div>
          )}

          {segmento === "personalizzato" && (
            <div className="space-y-2">
              <Label>Seleziona i destinatari</Label>
              <div className="max-h-56 overflow-y-auto rounded-md border p-2 space-y-1">
                {persone.map((p) => (
                  <label key={p.id} className="flex items-center gap-2 text-sm py-1">
                    <Checkbox
                      aria-label={`${p.cognome} ${p.nome}`}
                      checked={personaIdsSelezionati.includes(p.id)}
                      onCheckedChange={(v) => alternaPersona(p.id, v === true)}
                    />
                    {p.cognome} {p.nome} <span className="text-muted-foreground">({p.email})</span>
                  </label>
                ))}
              </div>
              {errors.personaIds && <p className="text-sm text-destructive">{errors.personaIds.message}</p>}
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            Variabili disponibili per questo segmento:{" "}
            {VARIABILI_TEMPLATE_PER_SEGMENTO[segmento].map((v) => (
              <code key={v} className="mx-0.5">{`{{${v}}}`}</code>
            ))}
          </p>

          <div className="space-y-2">
            <Label htmlFor="templateOggetto">Oggetto dell&apos;email</Label>
            <Input id="templateOggetto" {...register("templateOggetto")} />
            {errors.templateOggetto && <p className="text-sm text-destructive">{errors.templateOggetto.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="templateCorpo">Testo dell&apos;email</Label>
            <Textarea id="templateCorpo" rows={8} {...register("templateCorpo")} />
            {errors.templateCorpo && <p className="text-sm text-destructive">{errors.templateCorpo.message}</p>}
          </div>

          <Button type="submit" disabled={inAttesa}>
            {inAttesa && <Loader2 className="animate-spin" />}
            <Send /> Crea comunicazione
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
