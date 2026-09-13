"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Loader2, ExternalLink, Download } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  schemaConfigurazioneSitoPubblico,
  TEMPLATE_SITO_PUBBLICO,
  ETICHETTE_TEMPLATE_SITO_PUBBLICO,
  DESCRIZIONI_TEMPLATE_SITO_PUBBLICO,
  type DatiConfigurazioneSitoPubblico,
} from "@/lib/validazioni/sito-pubblico";
import { salvaConfigurazioneSitoPubblico } from "@/lib/sito-pubblico/actions";

export function TabSitoPubblico({ configurazione }: { configurazione: { presentazione: string; urlBase: string } }) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { isSubmitting, errors },
  } = useForm<DatiConfigurazioneSitoPubblico>({
    resolver: zodResolver(schemaConfigurazioneSitoPubblico),
    defaultValues: { presentazione: configurazione.presentazione, urlBase: configurazione.urlBase },
  });

  async function onSubmit(dati: DatiConfigurazioneSitoPubblico) {
    const esito = await salvaConfigurazioneSitoPubblico(dati);
    if ("errore" in esito) {
      toast.error(esito.errore);
      return;
    }
    toast.success("Configurazione del sito pubblico salvata.");
    router.refresh();
  }

  return (
    <div className="max-w-3xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Contenuti del sito</CardTitle>
          <CardDescription>
            Genera un sito vetrina statico (una pagina HTML, nessuna dipendenza esterna) con le informazioni
            dell&apos;associazione e i corsi attualmente aperti alle iscrizioni o in corso. Il sito generato è un
            file da scaricare e pubblicare dove preferisci (spazio web dell&apos;associazione, hosting statico,
            ecc.) — non viene pubblicato automaticamente da qui.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="space-y-2">
              <Label htmlFor="presentazione">Presentazione dell&apos;associazione (facoltativa)</Label>
              <Textarea
                id="presentazione"
                rows={4}
                placeholder="Un breve testo di presentazione mostrato nella sezione &quot;Chi siamo&quot;..."
                {...register("presentazione")}
              />
              {errors.presentazione && <p className="text-sm text-destructive">{errors.presentazione.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="urlBase">URL pubblico del gestionale (facoltativo)</Label>
              <Input id="urlBase" placeholder="https://gestionale.tuodominio.it" {...register("urlBase")} />
              {errors.urlBase && <p className="text-sm text-destructive">{errors.urlBase.message}</p>}
              <p className="text-xs text-muted-foreground">
                Usato per costruire i link &quot;Iscriviti&quot; nel sito generato, dato che il sito può essere
                ospitato altrove rispetto al gestionale. Se lasciato vuoto, i corsi non avranno un link di
                iscrizione.
              </p>
            </div>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="animate-spin" />}
              Salva
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-3">
        {TEMPLATE_SITO_PUBBLICO.map((template) => (
          <Card key={template}>
            <CardHeader>
              <CardTitle className="text-base">{ETICHETTE_TEMPLATE_SITO_PUBBLICO[template]}</CardTitle>
              <CardDescription>{DESCRIZIONI_TEMPLATE_SITO_PUBBLICO[template]}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              <Button variant="outline" size="sm" asChild>
                <a href={`/amministrazione/sito-pubblico/anteprima?template=${template}`} target="_blank" rel="noopener noreferrer">
                  <ExternalLink /> Anteprima
                </a>
              </Button>
              <Button size="sm" asChild>
                <a href={`/amministrazione/sito-pubblico/scarica?template=${template}`}>
                  <Download /> Scarica sito
                </a>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
