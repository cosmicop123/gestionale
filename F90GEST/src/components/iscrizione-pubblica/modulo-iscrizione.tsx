"use client";

import { useState } from "react";
import { useForm, useWatch, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  schemaIscrizionePubblica,
  CANALI_IMMAGINI,
  ETICHETTE_CANALI_IMMAGINI,
  type DatiIscrizionePubblica,
} from "@/lib/validazioni/consenso";
import { isMinorenne } from "@/lib/persona/eta";
import { inviaPreiscrizionePubblica } from "@/lib/iscrizione-pubblica/actions";

const VALORI_VUOTI: DatiIscrizionePubblica = {
  nome: "",
  cognome: "",
  codiceFiscale: "",
  dataNascita: "",
  sesso: undefined,
  email: "",
  telefono: "",
  genitore: undefined,
  consensoTrattamento: false,
  consensoImmagini: false,
  canaliImmagini: [],
  consensoNewsletter: false,
  consensoTerzi: false,
};

export function ModuloIscrizionePubblica({
  corsoId,
  testoInformativa,
}: {
  corsoId: string;
  testoInformativa: string;
}) {
  const [inviata, setInviata] = useState(false);
  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { isSubmitting, errors },
  } = useForm<DatiIscrizionePubblica>({
    resolver: zodResolver(schemaIscrizionePubblica),
    defaultValues: VALORI_VUOTI,
  });

  const dataNascita = useWatch({ control, name: "dataNascita" });
  const mostraCampiGenitore = !!dataNascita && isMinorenne(new Date(dataNascita));
  const consensoImmagini = useWatch({ control, name: "consensoImmagini" });
  const canaliSelezionati = useWatch({ control, name: "canaliImmagini" }) ?? [];

  function toggleCanale(canale: (typeof CANALI_IMMAGINI)[number], checked: boolean) {
    const attuali = new Set(canaliSelezionati);
    if (checked) attuali.add(canale);
    else attuali.delete(canale);
    setValue("canaliImmagini", Array.from(attuali));
  }

  async function onSubmit(dati: DatiIscrizionePubblica) {
    const esito = await inviaPreiscrizionePubblica(corsoId, dati);
    if ("errore" in esito) {
      toast.error(esito.errore);
      return;
    }
    setInviata(true);
  }

  if (inviata) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
          <CheckCircle2 className="size-10 text-success" />
          <p className="font-medium">Richiesta di iscrizione inviata.</p>
          <p className="text-sm text-muted-foreground">
            La segreteria dell&apos;associazione verificherà i dati e ti ricontatterà per confermare
            l&apos;iscrizione.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form className="space-y-8" onSubmit={handleSubmit(onSubmit)} noValidate>
          <section className="space-y-4">
            <h2 className="text-sm font-semibold text-muted-foreground">Dati della persona da iscrivere</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome *</Label>
                <Input id="nome" {...register("nome")} />
                {errors.nome && <p className="text-sm text-destructive">{errors.nome.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="cognome">Cognome *</Label>
                <Input id="cognome" {...register("cognome")} />
                {errors.cognome && <p className="text-sm text-destructive">{errors.cognome.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="codiceFiscale">Codice fiscale *</Label>
                <Input id="codiceFiscale" maxLength={16} className="uppercase" {...register("codiceFiscale")} />
                {errors.codiceFiscale && (
                  <p className="text-sm text-destructive">{errors.codiceFiscale.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="dataNascita">Data di nascita *</Label>
                <Input id="dataNascita" type="date" {...register("dataNascita")} />
                {errors.dataNascita && <p className="text-sm text-destructive">{errors.dataNascita.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="sesso">Sesso</Label>
                <Controller
                  control={control}
                  name="sesso"
                  render={({ field }) => (
                    <Select value={field.value ?? ""} onValueChange={field.onChange}>
                      <SelectTrigger id="sesso" className="w-full">
                        <SelectValue placeholder="Non specificato" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="M">M</SelectItem>
                        <SelectItem value="F">F</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" {...register("email")} />
                {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="telefono">Telefono</Label>
                <Input id="telefono" {...register("telefono")} />
              </div>
            </div>
          </section>

          {mostraCampiGenitore && (
            <section className="space-y-4 rounded-lg border border-warning/40 bg-warning/5 p-4">
              <h2 className="text-sm font-semibold">Esercente la responsabilità genitoriale</h2>
              <p className="text-xs text-muted-foreground">
                Obbligatorio per una persona minorenne: dati di un genitore o tutore, che firma anche i
                consensi qui sotto.
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="genitore.genitoreNomeCognome">Nome e cognome *</Label>
                  <Input id="genitore.genitoreNomeCognome" {...register("genitore.genitoreNomeCognome")} />
                  {errors.genitore?.genitoreNomeCognome && (
                    <p className="text-sm text-destructive">{errors.genitore.genitoreNomeCognome.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="genitore.genitoreCodiceFiscale">Codice fiscale</Label>
                  <Input id="genitore.genitoreCodiceFiscale" {...register("genitore.genitoreCodiceFiscale")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="genitore.gradoParentela">Grado di parentela *</Label>
                  <Controller
                    control={control}
                    name="genitore.gradoParentela"
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger id="genitore.gradoParentela" className="w-full">
                          <SelectValue placeholder="Seleziona" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="genitore">Genitore</SelectItem>
                          <SelectItem value="tutore">Tutore</SelectItem>
                          <SelectItem value="altro_esercente">Altro esercente</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="genitore.genitoreEmail">Email</Label>
                  <Input id="genitore.genitoreEmail" type="email" {...register("genitore.genitoreEmail")} />
                  {errors.genitore?.genitoreEmail && (
                    <p className="text-sm text-destructive">{errors.genitore.genitoreEmail.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="genitore.genitoreTelefono">Telefono</Label>
                  <Input id="genitore.genitoreTelefono" {...register("genitore.genitoreTelefono")} />
                </div>
              </div>
            </section>
          )}
          {errors.genitore && !errors.genitore.genitoreNomeCognome && (
            <p className="text-sm text-destructive">{errors.genitore.message as string}</p>
          )}

          <section className="space-y-4">
            <h2 className="text-sm font-semibold text-muted-foreground">Informativa sul trattamento dei dati</h2>
            <div className="max-h-48 overflow-y-auto rounded-md border p-3 text-xs whitespace-pre-wrap text-muted-foreground">
              {testoInformativa}
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-muted-foreground">Consensi</h2>
            <p className="text-xs text-muted-foreground">
              Ogni consenso è separato e facoltativo, salvo dove indicato: nessuna casella è già selezionata.
            </p>

            <label className="flex items-start gap-2">
              <Controller
                control={control}
                name="consensoTrattamento"
                render={({ field }) => (
                  <Checkbox checked={field.value} onCheckedChange={(v) => field.onChange(v === true)} />
                )}
              />
              <span className="text-sm">
                Acconsento al trattamento dei dati per la gestione dell&apos;iscrizione e delle attività
                associative *
              </span>
            </label>
            {errors.consensoTrattamento && (
              <p className="text-sm text-destructive">{errors.consensoTrattamento.message}</p>
            )}

            <label className="flex items-start gap-2">
              <Controller
                control={control}
                name="consensoImmagini"
                render={({ field }) => (
                  <Checkbox checked={field.value} onCheckedChange={(v) => field.onChange(v === true)} />
                )}
              />
              <span className="text-sm">Acconsento all&apos;utilizzo di immagini e video (facoltativo)</span>
            </label>
            {consensoImmagini && (
              <div className="ml-6 space-y-1.5">
                {CANALI_IMMAGINI.map((canale) => (
                  <label key={canale} className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={canaliSelezionati.includes(canale)}
                      onCheckedChange={(v) => toggleCanale(canale, v === true)}
                    />
                    {ETICHETTE_CANALI_IMMAGINI[canale]}
                  </label>
                ))}
                {errors.canaliImmagini && (
                  <p className="text-sm text-destructive">{errors.canaliImmagini.message}</p>
                )}
              </div>
            )}

            <label className="flex items-start gap-2">
              <Controller
                control={control}
                name="consensoNewsletter"
                render={({ field }) => (
                  <Checkbox checked={field.value} onCheckedChange={(v) => field.onChange(v === true)} />
                )}
              />
              <span className="text-sm">
                Acconsento a ricevere comunicazioni promozionali sulle attività dell&apos;associazione (facoltativo)
              </span>
            </label>

            <label className="flex items-start gap-2">
              <Controller
                control={control}
                name="consensoTerzi"
                render={({ field }) => (
                  <Checkbox checked={field.value} onCheckedChange={(v) => field.onChange(v === true)} />
                )}
              />
              <span className="text-sm">
                Acconsento alla comunicazione dei dati a soggetti terzi indicati nell&apos;informativa (facoltativo)
              </span>
            </label>
          </section>

          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting && <Loader2 className="animate-spin" />}
            Invia richiesta di iscrizione
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
