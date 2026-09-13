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
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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
import { schemaDelibera, ESITI_DELIBERA, ETICHETTE_ESITI_DELIBERA, type DatiDelibera } from "@/lib/validazioni/riunione";
import { aggiungiDelibera } from "@/lib/riunione/actions";

type DeliberaRiga = {
  id: string;
  oggetto: string;
  esito: string;
  votiFavorevoli: number | null;
  votiContrari: number | null;
  votiAstenuti: number | null;
};

const VARIANTE_ESITO: Record<string, "success" | "warning" | "destructive"> = {
  approvata: "success",
  respinta: "destructive",
  rinviata: "warning",
};

function DialogNuovaDelibera({ riunioneId }: { riunioneId: string }) {
  const router = useRouter();
  const [aperto, setAperto] = useState(false);
  const { handleSubmit, control, register, formState: { errors, isSubmitting } } = useForm<DatiDelibera>({
    resolver: zodResolver(schemaDelibera),
    defaultValues: { oggetto: "", esito: "approvata", votiFavorevoli: "", votiContrari: "", votiAstenuti: "" },
  });

  async function onSubmit(dati: DatiDelibera) {
    const esito = await aggiungiDelibera(riunioneId, dati);
    if ("errore" in esito) {
      toast.error(esito.errore);
      return;
    }
    toast.success("Delibera aggiunta.");
    setAperto(false);
    router.refresh();
  }

  return (
    <Dialog open={aperto} onOpenChange={setAperto}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus /> Nuova delibera
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nuova delibera</DialogTitle>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="space-y-2">
            <Label htmlFor="oggetto">Oggetto</Label>
            <Textarea id="oggetto" rows={2} {...register("oggetto")} />
            {errors.oggetto && <p className="text-sm text-destructive">{errors.oggetto.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="esito">Esito</Label>
            <Controller
              control={control}
              name="esito"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="esito" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ESITI_DELIBERA.map((e) => (
                      <SelectItem key={e} value={e}>
                        {ETICHETTE_ESITI_DELIBERA[e]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="votiFavorevoli">Favorevoli</Label>
              <Input id="votiFavorevoli" type="number" min="0" {...register("votiFavorevoli")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="votiContrari">Contrari</Label>
              <Input id="votiContrari" type="number" min="0" {...register("votiContrari")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="votiAstenuti">Astenuti</Label>
              <Input id="votiAstenuti" type="number" min="0" {...register("votiAstenuti")} />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="animate-spin" />}
              Aggiungi
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function TabDelibere({
  riunioneId,
  delibere,
  puoGestire,
}: {
  riunioneId: string;
  delibere: DeliberaRiga[];
  puoGestire: boolean;
}) {
  return (
    <Card>
      <CardContent className="space-y-4 pt-6">
        {puoGestire && (
          <div className="flex justify-end">
            <DialogNuovaDelibera riunioneId={riunioneId} />
          </div>
        )}
        <div className="space-y-3">
          {delibere.length === 0 && <p className="text-center text-sm text-muted-foreground">Nessuna delibera.</p>}
          {delibere.map((d) => (
            <div key={d.id} className="rounded-md border p-3">
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm">{d.oggetto}</p>
                <Badge variant={VARIANTE_ESITO[d.esito] ?? "outline"}>
                  {ETICHETTE_ESITI_DELIBERA[d.esito as keyof typeof ETICHETTE_ESITI_DELIBERA] ?? d.esito}
                </Badge>
              </div>
              {(d.votiFavorevoli !== null || d.votiContrari !== null || d.votiAstenuti !== null) && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Favorevoli {d.votiFavorevoli ?? "—"} · Contrari {d.votiContrari ?? "—"} · Astenuti{" "}
                  {d.votiAstenuti ?? "—"}
                </p>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
