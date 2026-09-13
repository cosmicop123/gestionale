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
import { schemaRiunione, TIPI_RIUNIONE, ETICHETTE_TIPI_RIUNIONE, type DatiRiunione } from "@/lib/validazioni/riunione";
import { creaRiunione } from "@/lib/riunione/actions";

export function RiunioneNuovoForm() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    control,
    formState: { isSubmitting, errors },
  } = useForm<DatiRiunione>({
    resolver: zodResolver(schemaRiunione),
    defaultValues: {
      tipo: "direttivo",
      data: new Date().toISOString().slice(0, 10),
      ora: "",
      sede: "",
      ordineDelGiorno: "",
    },
  });

  async function onSubmit(dati: DatiRiunione) {
    const esito = await creaRiunione(dati);
    if ("errore" in esito) {
      toast.error(esito.errore);
      return;
    }
    toast.success("Riunione creata.");
    router.push(`/libri-sociali/riunioni/${esito.riunioneId}`);
    router.refresh();
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="space-y-2">
            <Label htmlFor="tipo">Tipo</Label>
            <Controller
              control={control}
              name="tipo"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="tipo" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIPI_RIUNIONE.map((t) => (
                      <SelectItem key={t} value={t}>
                        {ETICHETTE_TIPI_RIUNIONE[t]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="data">Data</Label>
              <Input id="data" type="date" {...register("data")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ora">Ora</Label>
              <Input id="ora" type="time" {...register("ora")} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="sede">Sede</Label>
            <Input id="sede" {...register("sede")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ordineDelGiorno">Ordine del giorno</Label>
            <Textarea id="ordineDelGiorno" rows={4} {...register("ordineDelGiorno")} />
            {errors.ordineDelGiorno && (
              <p className="text-sm text-destructive">{errors.ordineDelGiorno.message}</p>
            )}
          </div>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="animate-spin" />}
            Crea riunione
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
