"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { schemaMovimentoRaccoltaFondi, type DatiMovimentoRaccoltaFondi } from "@/lib/validazioni/evento";
import { registraMovimentoRaccoltaFondi } from "@/lib/raccolta-fondi/actions";

type ContoOpzione = { id: string; nome: string };

export function DialogMovimentoRaccolta({
  raccoltaFondiId,
  conti,
}: {
  raccoltaFondiId: string;
  conti: ContoOpzione[];
}) {
  const router = useRouter();
  const [aperto, setAperto] = useState(false);
  const { handleSubmit, control, register, formState: { errors, isSubmitting } } = useForm<DatiMovimentoRaccoltaFondi>({
    resolver: zodResolver(schemaMovimentoRaccoltaFondi),
    defaultValues: {
      tipo: "entrata",
      data: new Date().toISOString().slice(0, 10),
      importo: "",
      contoId: conti[0]?.id ?? "",
      causale: "",
    },
  });

  async function onSubmit(dati: DatiMovimentoRaccoltaFondi) {
    const esito = await registraMovimentoRaccoltaFondi(raccoltaFondiId, dati);
    if ("errore" in esito) {
      toast.error(esito.errore);
      return;
    }
    toast.success("Movimento registrato.");
    setAperto(false);
    router.refresh();
  }

  return (
    <Dialog open={aperto} onOpenChange={setAperto}>
      <DialogTrigger asChild>
        <Button size="sm" disabled={conti.length === 0}>
          <Plus /> Registra movimento
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registra un movimento della raccolta fondi</DialogTitle>
        </DialogHeader>
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
                    <SelectItem value="entrata">Entrata</SelectItem>
                    <SelectItem value="uscita">Uscita</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="importo">Importo (€)</Label>
              <Input id="importo" type="number" min="0" step="0.01" {...register("importo")} />
              {errors.importo && <p className="text-sm text-destructive">{errors.importo.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="data">Data</Label>
              <Input id="data" type="date" {...register("data")} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="contoId">Conto</Label>
            <Controller
              control={control}
              name="contoId"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="contoId" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {conti.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="causale">Causale</Label>
            <Input id="causale" {...register("causale")} />
            {errors.causale && <p className="text-sm text-destructive">{errors.causale.message}</p>}
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="animate-spin" />}
              Registra
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
