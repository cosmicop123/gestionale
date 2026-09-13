"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { schemaVerbale, type DatiVerbale } from "@/lib/validazioni/riunione";
import { salvaVerbale } from "@/lib/riunione/actions";

export function TabVerbale({
  riunioneId,
  verbaleTesto,
  puoGestire,
}: {
  riunioneId: string;
  verbaleTesto: string | null;
  puoGestire: boolean;
}) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<DatiVerbale>({
    resolver: zodResolver(schemaVerbale),
    defaultValues: { verbaleTesto: verbaleTesto ?? "" },
  });

  async function onSubmit(dati: DatiVerbale) {
    const esito = await salvaVerbale(riunioneId, dati);
    if ("errore" in esito) {
      toast.error(esito.errore);
      return;
    }
    toast.success("Verbale salvato.");
    router.refresh();
  }

  if (!puoGestire) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="whitespace-pre-wrap text-sm">{verbaleTesto ?? "Verbale non ancora redatto."}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="space-y-2">
            <Label htmlFor="verbaleTesto">Testo del verbale</Label>
            <Textarea id="verbaleTesto" rows={16} {...register("verbaleTesto")} />
          </div>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="animate-spin" />}
            Salva verbale
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
