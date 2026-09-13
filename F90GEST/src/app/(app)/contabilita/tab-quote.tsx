"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm, useWatch, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Loader2, Users } from "lucide-react";
import { toast } from "sonner";
import type { Quota, TipoQuota } from "@prisma/client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { schemaGeneraQuoteMassivo, type DatiGeneraQuoteMassivo } from "@/lib/validazioni/quota";
import { generaQuoteMassivo } from "@/lib/quota/actions";

type QuotaConRelazioni = Quota & { persona: { nome: string; cognome: string }; tipoQuota: { descrizione: string } };
type SocioOpzione = { personaId: string; nome: string; cognome: string; numeroLibroSoci: number };

const VARIANTE_STATO: Record<string, "success" | "warning" | "secondary" | "outline" | "destructive"> = {
  pagata: "success",
  parziale: "warning",
  da_pagare: "outline",
  esente: "secondary",
  stornata: "destructive",
};

function formattaEuro(valore: number): string {
  return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(valore);
}

function DialogGenerazioneMassiva({
  tipiQuota,
  soci,
}: {
  tipiQuota: TipoQuota[];
  soci: SocioOpzione[];
}) {
  const router = useRouter();
  const [aperto, setAperto] = useState(false);
  const {
    handleSubmit,
    control,
    register,
    setValue,
    formState: { isSubmitting },
  } = useForm<DatiGeneraQuoteMassivo>({
    resolver: zodResolver(schemaGeneraQuoteMassivo),
    defaultValues: { personaIds: [], tipoQuotaId: tipiQuota[0]?.id ?? "", scadenza: new Date().toISOString().slice(0, 10) },
  });
  const selezionati = useWatch({ control, name: "personaIds" }) ?? [];

  function toggleSocio(personaId: string, checked: boolean) {
    const attuali = new Set(selezionati);
    if (checked) attuali.add(personaId);
    else attuali.delete(personaId);
    setValue("personaIds", Array.from(attuali));
  }

  async function onSubmit(dati: DatiGeneraQuoteMassivo) {
    const esito = await generaQuoteMassivo(dati);
    if ("errore" in esito) {
      toast.error(esito.errore);
      return;
    }
    toast.success(`Generate ${esito.generate} quote su ${dati.personaIds.length} selezionati.`);
    setAperto(false);
    router.refresh();
  }

  return (
    <Dialog open={aperto} onOpenChange={setAperto}>
      <DialogTrigger asChild>
        <Button size="sm" disabled={tipiQuota.length === 0 || soci.length === 0}>
          <Users /> Rinnovo massivo
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Genera quote per più soci</DialogTitle>
          <DialogDescription>
            Salta automaticamente chi ha già una quota di questo tipo per l&apos;anno sociale.
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="space-y-2">
            <Label htmlFor="tipoQuotaId">Tipo di quota</Label>
            <Controller
              control={control}
              name="tipoQuotaId"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="tipoQuotaId" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {tipiQuota.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.descrizione}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="scadenza">Scadenza</Label>
            <Input id="scadenza" type="date" {...register("scadenza")} />
          </div>
          <div className="space-y-2">
            <Label>Soci ({selezionati.length} selezionati)</Label>
            <div className="max-h-64 space-y-1 overflow-y-auto rounded-md border p-2">
              {soci.map((socio) => (
                <label key={socio.personaId} className="flex items-center gap-2 rounded px-2 py-1.5 hover:bg-accent">
                  <Checkbox
                    checked={selezionati.includes(socio.personaId)}
                    onCheckedChange={(v) => toggleSocio(socio.personaId, v === true)}
                  />
                  <span className="text-sm">
                    {socio.numeroLibroSoci}. {socio.cognome} {socio.nome}
                  </span>
                </label>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting || selezionati.length === 0}>
              {isSubmitting && <Loader2 className="animate-spin" />}
              Genera {selezionati.length} quote
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function TabQuote({
  quote,
  tipiQuota,
  soci,
  puoScrivere,
}: {
  quote: QuotaConRelazioni[];
  tipiQuota: TipoQuota[];
  soci: SocioOpzione[];
  puoScrivere: boolean;
}) {
  return (
    <Card>
      <CardContent className="space-y-4 pt-6">
        {puoScrivere && (
          <div className="flex justify-end">
            <DialogGenerazioneMassiva tipiQuota={tipiQuota} soci={soci} />
          </div>
        )}

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Socio</TableHead>
              <TableHead>Tipo quota</TableHead>
              <TableHead>Scadenza</TableHead>
              <TableHead>Stato</TableHead>
              <TableHead className="text-right">Importo</TableHead>
              <TableHead className="text-right">Azioni</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {quote.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  Nessuna quota generata.
                </TableCell>
              </TableRow>
            )}
            {quote.map((quota) => (
              <TableRow key={quota.id}>
                <TableCell className="font-medium">
                  {quota.persona.cognome} {quota.persona.nome}
                </TableCell>
                <TableCell>{quota.tipoQuota.descrizione}</TableCell>
                <TableCell>{new Intl.DateTimeFormat("it-IT").format(quota.scadenza)}</TableCell>
                <TableCell>
                  <Badge variant={VARIANTE_STATO[quota.stato] ?? "outline"}>{quota.stato}</Badge>
                </TableCell>
                <TableCell className="text-right">{formattaEuro(Number(quota.importo))}</TableCell>
                <TableCell className="text-right">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/soci/${quota.personaId}`}>Apri scheda</Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
