"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { schemaEnte, type DatiEnte } from "@/lib/validazioni/ente";
import { salvaDatiEnte } from "@/lib/ente/actions";

type ProprietaEnteForm = {
  valoriIniziali: DatiEnte;
  segnaConfigurazioneCompletata?: boolean;
  onSalvato?: () => void;
  testoBottone?: string;
};

export function EnteForm({
  valoriIniziali,
  segnaConfigurazioneCompletata,
  onSalvato,
  testoBottone = "Salva",
}: ProprietaEnteForm) {
  const [inAttesa, setInAttesa] = useState(false);
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<DatiEnte>({
    resolver: zodResolver(schemaEnte),
    defaultValues: valoriIniziali,
  });

  async function onSubmit(dati: DatiEnte) {
    setInAttesa(true);
    try {
      const esito = await salvaDatiEnte(dati, { segnaConfigurazioneCompletata });
      if ("errore" in esito) {
        toast.error(esito.errore);
        return;
      }
      toast.success("Dati dell'associazione salvati.");
      onSalvato?.();
    } catch {
      toast.error("Errore imprevisto durante il salvataggio. Riprova.");
    } finally {
      setInAttesa(false);
    }
  }

  return (
    <form className="space-y-8" onSubmit={handleSubmit(onSubmit)} noValidate>
      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-muted-foreground">Dati identificativi</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="denominazione">Denominazione *</Label>
            <Input id="denominazione" {...register("denominazione")} />
            {errors.denominazione && (
              <p className="text-sm text-destructive">{errors.denominazione.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="codiceFiscale">Codice fiscale *</Label>
            <Input id="codiceFiscale" maxLength={11} {...register("codiceFiscale")} />
            {errors.codiceFiscale && (
              <p className="text-sm text-destructive">{errors.codiceFiscale.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="partitaIva">Partita IVA (se presente)</Label>
            <Input id="partitaIva" maxLength={11} {...register("partitaIva")} />
            {errors.partitaIva && (
              <p className="text-sm text-destructive">{errors.partitaIva.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="dataCostituzione">Data di costituzione</Label>
            <Input id="dataCostituzione" type="date" {...register("dataCostituzione")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="statutoRiferimento">Estremi statuto</Label>
            <Input
              id="statutoRiferimento"
              placeholder="es. atto notarile del ..., registrato il ..."
              {...register("statutoRiferimento")}
            />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-muted-foreground">Sede legale</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="sedeLegaleVia">Indirizzo *</Label>
            <Input id="sedeLegaleVia" {...register("sedeLegaleVia")} />
            {errors.sedeLegaleVia && (
              <p className="text-sm text-destructive">{errors.sedeLegaleVia.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="sedeLegaleCap">CAP *</Label>
            <Input id="sedeLegaleCap" maxLength={5} {...register("sedeLegaleCap")} />
            {errors.sedeLegaleCap && (
              <p className="text-sm text-destructive">{errors.sedeLegaleCap.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="sedeLegaleComune">Comune *</Label>
            <Input id="sedeLegaleComune" {...register("sedeLegaleComune")} />
            {errors.sedeLegaleComune && (
              <p className="text-sm text-destructive">{errors.sedeLegaleComune.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="sedeLegaleProvincia">Provincia *</Label>
            <Input id="sedeLegaleProvincia" maxLength={2} {...register("sedeLegaleProvincia")} />
            {errors.sedeLegaleProvincia && (
              <p className="text-sm text-destructive">{errors.sedeLegaleProvincia.message}</p>
            )}
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-muted-foreground">Contatti e coordinate bancarie</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="pec">PEC</Label>
            <Input id="pec" type="email" {...register("pec")} />
            {errors.pec && <p className="text-sm text-destructive">{errors.pec.message}</p>}
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
          <div className="space-y-2">
            <Label htmlFor="iban">IBAN</Label>
            <Input id="iban" {...register("iban")} />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-muted-foreground">Regime ed enti di riferimento</h2>
        <Controller
          control={control}
          name="iscrittoRunts"
          render={({ field }) => (
            <>
              <div className="flex items-start gap-3">
                <Checkbox
                  id="iscrittoRunts"
                  checked={field.value}
                  onCheckedChange={(valore) => field.onChange(valore === true)}
                />
                <div className="space-y-1">
                  <Label htmlFor="iscrittoRunts">Associazione iscritta al RUNTS</Label>
                  <p className="text-xs text-muted-foreground">
                    Lasciare deselezionato se non ancora iscritta: il gestionale resta comunque
                    pronto per un&apos;eventuale iscrizione futura.
                  </p>
                </div>
              </div>
              {field.value && (
                <div className="space-y-2 sm:max-w-xs">
                  <Label htmlFor="numeroRunts">Numero di iscrizione RUNTS</Label>
                  <Input id="numeroRunts" {...register("numeroRunts")} />
                </div>
              )}
            </>
          )}
        />
        <div className="space-y-2">
          <Label htmlFor="regimeFiscale">Regime fiscale</Label>
          <Input
            id="regimeFiscale"
            placeholder="es. nessuna P.IVA — verificare con il proprio consulente fiscale"
            {...register("regimeFiscale")}
          />
          <p className="text-xs text-muted-foreground">
            Campo descrittivo: il gestionale non fornisce consulenza fiscale.
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="piePaginaRicevute">Testo normativo a piè di pagina delle ricevute</Label>
          <Textarea id="piePaginaRicevute" rows={3} {...register("piePaginaRicevute")} />
        </div>
      </section>

      <Button type="submit" disabled={inAttesa}>
        {inAttesa && <Loader2 className="animate-spin" />}
        {testoBottone}
      </Button>
    </form>
  );
}
