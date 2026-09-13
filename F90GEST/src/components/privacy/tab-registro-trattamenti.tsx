"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { schemaRegistroTrattamento, type DatiRegistroTrattamento } from "@/lib/validazioni/privacy";
import { creaTrattamento, modificaTrattamento, eliminaTrattamento } from "@/lib/registro-trattamenti/actions";

type TrattamentoRiga = {
  id: string;
  nomeTrattamento: string;
  finalita: string;
  baseGiuridica: string;
  categorieDati: string;
  categorieInteressati: string;
  destinatari: string | null;
  tempiConservazione: string;
  misureSicurezza: string;
};

function CampiTrattamento({
  register,
  errors,
}: {
  register: ReturnType<typeof useForm<DatiRegistroTrattamento>>["register"];
  errors: ReturnType<typeof useForm<DatiRegistroTrattamento>>["formState"]["errors"];
}) {
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="nomeTrattamento">Nome del trattamento</Label>
        <Input id="nomeTrattamento" {...register("nomeTrattamento")} />
        {errors.nomeTrattamento && <p className="text-sm text-destructive">{errors.nomeTrattamento.message}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="finalita">Finalità</Label>
        <Textarea id="finalita" rows={2} {...register("finalita")} />
        {errors.finalita && <p className="text-sm text-destructive">{errors.finalita.message}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="baseGiuridica">Base giuridica</Label>
        <Input id="baseGiuridica" {...register("baseGiuridica")} />
        {errors.baseGiuridica && <p className="text-sm text-destructive">{errors.baseGiuridica.message}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="categorieDati">Categorie di dati trattati</Label>
        <Textarea id="categorieDati" rows={2} {...register("categorieDati")} />
        {errors.categorieDati && <p className="text-sm text-destructive">{errors.categorieDati.message}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="categorieInteressati">Categorie di interessati</Label>
        <Input id="categorieInteressati" {...register("categorieInteressati")} />
        {errors.categorieInteressati && <p className="text-sm text-destructive">{errors.categorieInteressati.message}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="destinatari">Destinatari dei dati (facoltativo)</Label>
        <Input id="destinatari" {...register("destinatari")} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="tempiConservazione">Tempi di conservazione</Label>
        <Input id="tempiConservazione" {...register("tempiConservazione")} />
        {errors.tempiConservazione && <p className="text-sm text-destructive">{errors.tempiConservazione.message}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="misureSicurezza">Misure di sicurezza adottate</Label>
        <Textarea id="misureSicurezza" rows={2} {...register("misureSicurezza")} />
        {errors.misureSicurezza && <p className="text-sm text-destructive">{errors.misureSicurezza.message}</p>}
      </div>
    </>
  );
}

function DialogTrattamento({ trattamento }: { trattamento?: TrattamentoRiga }) {
  const router = useRouter();
  const [aperto, setAperto] = useState(false);
  const {
    handleSubmit,
    register,
    formState: { errors, isSubmitting },
  } = useForm<DatiRegistroTrattamento>({
    resolver: zodResolver(schemaRegistroTrattamento),
    defaultValues: trattamento
      ? {
          nomeTrattamento: trattamento.nomeTrattamento,
          finalita: trattamento.finalita,
          baseGiuridica: trattamento.baseGiuridica,
          categorieDati: trattamento.categorieDati,
          categorieInteressati: trattamento.categorieInteressati,
          destinatari: trattamento.destinatari ?? "",
          tempiConservazione: trattamento.tempiConservazione,
          misureSicurezza: trattamento.misureSicurezza,
        }
      : undefined,
  });

  async function onSubmit(dati: DatiRegistroTrattamento) {
    const esito = trattamento ? await modificaTrattamento(trattamento.id, dati) : await creaTrattamento(dati);
    if ("errore" in esito) {
      toast.error(esito.errore);
      return;
    }
    toast.success(trattamento ? "Trattamento aggiornato." : "Trattamento aggiunto al registro.");
    setAperto(false);
    router.refresh();
  }

  return (
    <Dialog open={aperto} onOpenChange={setAperto}>
      <DialogTrigger asChild>
        {trattamento ? (
          <Button variant="ghost" size="icon">
            <Pencil />
          </Button>
        ) : (
          <Button size="sm">
            <Plus /> Nuovo trattamento
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{trattamento ? "Modifica trattamento" : "Nuovo trattamento"}</DialogTitle>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
          <CampiTrattamento register={register} errors={errors} />
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="animate-spin" />}
              Salva
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function TabRegistroTrattamenti({ trattamenti }: { trattamenti: TrattamentoRiga[] }) {
  const router = useRouter();

  async function onElimina(id: string) {
    const esito = await eliminaTrattamento(id);
    if ("errore" in esito) {
      toast.error(esito.errore);
      return;
    }
    router.refresh();
  }

  return (
    <Card>
      <CardContent className="space-y-4 pt-6">
        <div className="flex justify-end">
          <DialogTrattamento />
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Trattamento</TableHead>
              <TableHead>Finalità</TableHead>
              <TableHead>Base giuridica</TableHead>
              <TableHead className="text-right">Azioni</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {trattamenti.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">
                  Nessun trattamento registrato.
                </TableCell>
              </TableRow>
            )}
            {trattamenti.map((t) => (
              <TableRow key={t.id}>
                <TableCell className="font-medium">{t.nomeTrattamento}</TableCell>
                <TableCell className="max-w-sm truncate text-muted-foreground">{t.finalita}</TableCell>
                <TableCell className="text-muted-foreground">{t.baseGiuridica}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <DialogTrattamento trattamento={t} />
                    <Button variant="ghost" size="icon" onClick={() => onElimina(t.id)}>
                      <Trash2 className="text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
