"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { schemaModificaCorso, type DatiModificaCorso } from "@/lib/validazioni/corso";
import { modificaCorso } from "@/lib/corso/actions";

function formattaDataInput(data: Date | null): string {
  return data ? data.toISOString().slice(0, 10) : "";
}

type CorsoDettagli = {
  id: string;
  titolo: string;
  edizione: string | null;
  descrizione: string | null;
  destinatari: string | null;
  sede: string | null;
  dataInizio: Date;
  dataFine: Date | null;
  capienzaMassima: number | null;
  quotaPartecipazione: unknown;
  percentualeMinimaPresenzaAttestato: unknown;
};

export function TabDettagli({ corso, puoGestire }: { corso: CorsoDettagli; puoGestire: boolean }) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { isSubmitting, errors },
  } = useForm<DatiModificaCorso>({
    resolver: zodResolver(schemaModificaCorso),
    defaultValues: {
      titolo: corso.titolo,
      edizione: corso.edizione ?? "",
      descrizione: corso.descrizione ?? "",
      destinatari: corso.destinatari ?? "",
      sede: corso.sede ?? "",
      dataInizio: formattaDataInput(corso.dataInizio),
      dataFine: formattaDataInput(corso.dataFine),
      capienzaMassima: corso.capienzaMassima ? String(corso.capienzaMassima) : "",
      quotaPartecipazione: corso.quotaPartecipazione ? String(corso.quotaPartecipazione) : "",
      percentualeMinimaPresenzaAttestato: String(corso.percentualeMinimaPresenzaAttestato),
    },
  });

  async function onSubmit(dati: DatiModificaCorso) {
    const esito = await modificaCorso(corso.id, dati);
    if ("errore" in esito) {
      toast.error(esito.errore);
      return;
    }
    toast.success("Corso aggiornato.");
    router.refresh();
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <fieldset disabled={!puoGestire || isSubmitting} className="space-y-4">
          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="titolo">Titolo</Label>
                <Input id="titolo" {...register("titolo")} />
                {errors.titolo && <p className="text-sm text-destructive">{errors.titolo.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="edizione">Edizione</Label>
                <Input id="edizione" {...register("edizione")} />
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
                <Input id="destinatari" {...register("destinatari")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dataInizio">Data di inizio</Label>
                <Input id="dataInizio" type="date" {...register("dataInizio")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dataFine">Data di fine</Label>
                <Input id="dataFine" type="date" {...register("dataFine")} />
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
                <Label htmlFor="percentualeMinimaPresenzaAttestato">Percentuale minima presenza attestato</Label>
                <Input
                  id="percentualeMinimaPresenzaAttestato"
                  type="number"
                  min="0"
                  max="100"
                  {...register("percentualeMinimaPresenzaAttestato")}
                />
              </div>
            </div>
            {puoGestire && (
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="animate-spin" />}
                Salva modifiche
              </Button>
            )}
          </form>
        </fieldset>
      </CardContent>
    </Card>
  );
}
