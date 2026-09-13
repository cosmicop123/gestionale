"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { schemaInformativa, type DatiInformativa } from "@/lib/validazioni/informativa";
import { pubblicaInformativa } from "@/lib/informativa/actions";

type InformativaCorrente = { testo: string; dataPubblicazione: Date } | null;

export function TabInformativa({ informativaCorrente }: { informativaCorrente: InformativaCorrente }) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { isSubmitting, errors },
  } = useForm<DatiInformativa>({
    resolver: zodResolver(schemaInformativa),
    defaultValues: { testo: informativaCorrente?.testo ?? "" },
  });

  async function onSubmit(dati: DatiInformativa) {
    const esito = await pubblicaInformativa(dati);
    if ("errore" in esito) {
      toast.error(esito.errore);
      return;
    }
    toast.success("Nuova versione dell'informativa pubblicata.");
    router.refresh();
  }

  return (
    <div className="max-w-2xl space-y-6">
      {informativaCorrente && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Versione attualmente pubblicata</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-2 text-xs text-muted-foreground">
              Pubblicata il {new Intl.DateTimeFormat("it-IT", { dateStyle: "short", timeStyle: "short" }).format(informativaCorrente.dataPubblicazione)}
            </p>
            <p className="whitespace-pre-wrap text-sm">{informativaCorrente.testo}</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Pubblica una nuova versione</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Incolla qui il testo dell&apos;informativa privacy che l&apos;associazione ha predisposto (con il
            proprio consulente o DPO, se presente): il gestionale non genera né propone un testo, per non dare
            consulenza legale. Finché non viene pubblicata una versione, la pagina pubblica di iscrizione ai
            corsi resta disattivata.
          </p>
          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="space-y-2">
              <Label htmlFor="testo">Testo dell&apos;informativa</Label>
              <Textarea id="testo" rows={12} {...register("testo")} />
              {errors.testo && <p className="text-sm text-destructive">{errors.testo.message}</p>}
            </div>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="animate-spin" />}
              Pubblica nuova versione
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
