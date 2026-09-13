"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { schemaRaccoltaFondi, type DatiRaccoltaFondi } from "@/lib/validazioni/evento";
import { creaRaccoltaFondi } from "@/lib/raccolta-fondi/actions";

type EventoOpzione = { id: string; titolo: string };

export function RaccoltaFondiForm({ eventi }: { eventi: EventoOpzione[] }) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    control,
    formState: { isSubmitting, errors },
  } = useForm<DatiRaccoltaFondi>({
    resolver: zodResolver(schemaRaccoltaFondi),
    defaultValues: {
      denominazione: "",
      periodoInizio: new Date().toISOString().slice(0, 10),
      periodoFine: "",
      eventoId: "",
    },
  });

  async function onSubmit(dati: DatiRaccoltaFondi) {
    const esito = await creaRaccoltaFondi(dati);
    if ("errore" in esito) {
      toast.error(esito.errore);
      return;
    }
    toast.success("Raccolta fondi creata.");
    router.push(`/eventi/raccolte-fondi/${esito.raccoltaFondiId}`);
    router.refresh();
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="space-y-2">
            <Label htmlFor="denominazione">Denominazione</Label>
            <Input id="denominazione" {...register("denominazione")} />
            {errors.denominazione && <p className="text-sm text-destructive">{errors.denominazione.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="periodoInizio">Inizio periodo</Label>
              <Input id="periodoInizio" type="date" {...register("periodoInizio")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="periodoFine">Fine periodo</Label>
              <Input id="periodoFine" type="date" {...register("periodoFine")} />
            </div>
          </div>
          {eventi.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="eventoId">Evento collegato (facoltativo)</Label>
              <Controller
                control={control}
                name="eventoId"
                render={({ field }) => (
                  <Select value={field.value || undefined} onValueChange={field.onChange}>
                    <SelectTrigger id="eventoId" className="w-full">
                      <SelectValue placeholder="Nessuno" />
                    </SelectTrigger>
                    <SelectContent>
                      {eventi.map((e) => (
                        <SelectItem key={e.id} value={e.id}>
                          {e.titolo}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          )}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="animate-spin" />}
            Crea raccolta fondi
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
