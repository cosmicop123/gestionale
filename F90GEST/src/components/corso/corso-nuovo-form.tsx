"use client";

import { useState } from "react";
import { useForm, useWatch, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { schemaCorso, type DatiCorso, GIORNI_SETTIMANA } from "@/lib/validazioni/corso";
import { creaCorso } from "@/lib/corso/actions";

const oggi = () => new Date().toISOString().slice(0, 10);

export function CorsoNuovoForm() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { isSubmitting, errors },
  } = useForm<DatiCorso>({
    resolver: zodResolver(schemaCorso),
    defaultValues: {
      titolo: "",
      edizione: "",
      descrizione: "",
      destinatari: "",
      sede: "",
      dataInizio: oggi(),
      capienzaMassima: "",
      quotaPartecipazione: "",
      percentualeMinimaPresenzaAttestato: "70",
      generaCalendario: false,
      numeroLezioni: "",
      durataOreLezione: "",
      giorniSettimana: [],
      oraInizioLezione: "",
      oraFineLezione: "",
      festivita: [],
    },
  });
  const generaCalendario = useWatch({ control, name: "generaCalendario" });
  const giorniSelezionati = useWatch({ control, name: "giorniSettimana" }) ?? [];
  const [festivitaTesto, setFestivitaTesto] = useState("");

  function toggleGiorno(valore: number, checked: boolean) {
    const attuali = new Set(giorniSelezionati);
    if (checked) attuali.add(valore);
    else attuali.delete(valore);
    setValue("giorniSettimana", Array.from(attuali));
  }

  async function onSubmit(dati: DatiCorso) {
    const festivita = festivitaTesto
      .split("\n")
      .map((riga) => riga.trim())
      .filter(Boolean);
    const esito = await creaCorso({ ...dati, festivita });
    if ("errore" in esito) {
      toast.error(esito.errore);
      return;
    }
    toast.success("Corso creato.");
    router.push(`/corsi/${esito.corsoId}`);
    router.refresh();
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="titolo">Titolo del corso</Label>
              <Input id="titolo" {...register("titolo")} />
              {errors.titolo && <p className="text-sm text-destructive">{errors.titolo.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="edizione">Edizione</Label>
              <Input id="edizione" placeholder="es. 2026/2027" {...register("edizione")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sede">Sede</Label>
              <Input id="sede" {...register("sede")} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="descrizione">Descrizione</Label>
              <Textarea id="descrizione" rows={2} {...register("descrizione")} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="destinatari">Destinatari</Label>
              <Input id="destinatari" placeholder="es. adulti, bambini 6-10 anni..." {...register("destinatari")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dataInizio">Data di inizio</Label>
              <Input id="dataInizio" type="date" {...register("dataInizio")} />
              {errors.dataInizio && <p className="text-sm text-destructive">{errors.dataInizio.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="capienzaMassima">Capienza massima</Label>
              <Input id="capienzaMassima" type="number" min="1" {...register("capienzaMassima")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quotaPartecipazione">Quota di partecipazione (€)</Label>
              <Input id="quotaPartecipazione" type="number" min="0" step="0.01" {...register("quotaPartecipazione")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="percentualeMinimaPresenzaAttestato">
                Percentuale minima di presenza per l&apos;attestato
              </Label>
              <Input
                id="percentualeMinimaPresenzaAttestato"
                type="number"
                min="0"
                max="100"
                {...register("percentualeMinimaPresenzaAttestato")}
              />
              {errors.percentualeMinimaPresenzaAttestato && (
                <p className="text-sm text-destructive">{errors.percentualeMinimaPresenzaAttestato.message}</p>
              )}
            </div>
          </div>

          <div className="rounded-md border p-4">
            <label className="flex items-center gap-2">
              <Controller
                control={control}
                name="generaCalendario"
                render={({ field }) => (
                  <Checkbox checked={field.value} onCheckedChange={(v) => field.onChange(v === true)} />
                )}
              />
              <span className="text-sm font-medium">Genera automaticamente il calendario delle lezioni</span>
            </label>

            {generaCalendario && (
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="numeroLezioni">Numero di lezioni</Label>
                  <Input id="numeroLezioni" type="number" min="1" {...register("numeroLezioni")} />
                  {errors.numeroLezioni && <p className="text-sm text-destructive">{errors.numeroLezioni.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="durataOreLezione">Durata di ogni lezione (ore)</Label>
                  <Input id="durataOreLezione" type="number" min="0.5" step="0.5" {...register("durataOreLezione")} />
                  {errors.durataOreLezione && (
                    <p className="text-sm text-destructive">{errors.durataOreLezione.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="oraInizioLezione">Ora inizio</Label>
                  <Input id="oraInizioLezione" type="time" {...register("oraInizioLezione")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="oraFineLezione">Ora fine</Label>
                  <Input id="oraFineLezione" type="time" {...register("oraFineLezione")} />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>Giorni della settimana</Label>
                  <div className="flex flex-wrap gap-3">
                    {GIORNI_SETTIMANA.map((giorno) => (
                      <label key={giorno.valore} className="flex items-center gap-1.5 text-sm">
                        <Checkbox
                          checked={giorniSelezionati.includes(giorno.valore)}
                          onCheckedChange={(v) => toggleGiorno(giorno.valore, v === true)}
                        />
                        {giorno.etichetta}
                      </label>
                    ))}
                  </div>
                  {errors.giorniSettimana && (
                    <p className="text-sm text-destructive">{errors.giorniSettimana.message}</p>
                  )}
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="festivita">Festività da escludere (una data AAAA-MM-GG per riga)</Label>
                  <Textarea
                    id="festivita"
                    rows={3}
                    value={festivitaTesto}
                    onChange={(e) => setFestivitaTesto(e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="animate-spin" />}
            Crea corso
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
