"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Euro, FileText } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
import { schemaGeneraQuota, type DatiGeneraQuota } from "@/lib/validazioni/quota";
import {
  schemaPagamento,
  METODI_PAGAMENTO,
  ETICHETTE_METODI_PAGAMENTO,
  type DatiPagamento,
} from "@/lib/validazioni/contabilita";
import { generaQuota } from "@/lib/quota/actions";
import { registraPagamentoQuota } from "@/lib/pagamento/actions";

type TipoQuotaOpzione = { id: string; descrizione: string };
type ContoOpzione = { id: string; nome: string };
type Pagamento = { id: string; importo: unknown; data: Date; ricevuta: { id: string; numero: number; annoSolare: number } | null };
type QuotaConPagamenti = {
  id: string;
  importo: unknown;
  scadenza: Date;
  stato: string;
  tipoQuota: { descrizione: string };
  pagamenti: Pagamento[];
};

const VARIANTE_STATO: Record<string, "success" | "warning" | "secondary" | "outline" | "destructive"> = {
  pagata: "success",
  parziale: "warning",
  da_pagare: "outline",
  esente: "secondary",
  stornata: "destructive",
};

function formattaEuro(valore: unknown): string {
  return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(Number(valore));
}

function DialogNuovaQuota({ personaId, tipiQuota }: { personaId: string; tipiQuota: TipoQuotaOpzione[] }) {
  const router = useRouter();
  const [aperto, setAperto] = useState(false);
  const { handleSubmit, control, register, formState: { isSubmitting } } = useForm<DatiGeneraQuota>({
    resolver: zodResolver(schemaGeneraQuota),
    defaultValues: { personaId, tipoQuotaId: tipiQuota[0]?.id ?? "", scadenza: new Date().toISOString().slice(0, 10) },
  });

  async function onSubmit(dati: DatiGeneraQuota) {
    const esito = await generaQuota(dati);
    if ("errore" in esito) {
      toast.error(esito.errore);
      return;
    }
    toast.success("Quota generata.");
    setAperto(false);
    router.refresh();
  }

  return (
    <Dialog open={aperto} onOpenChange={setAperto}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" disabled={tipiQuota.length === 0}>
          <Plus /> Genera quota
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Genera una quota</DialogTitle>
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
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="animate-spin" />}
              Genera
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DialogRegistraPagamento({ quota, conti }: { quota: QuotaConPagamenti; conti: ContoOpzione[] }) {
  const router = useRouter();
  const [aperto, setAperto] = useState(false);
  const totalePagato = quota.pagamenti.reduce((s, p) => s + Number(p.importo), 0);
  const residuo = Number(quota.importo) - totalePagato;

  const { handleSubmit, control, register, formState: { errors, isSubmitting } } = useForm<DatiPagamento>({
    resolver: zodResolver(schemaPagamento),
    defaultValues: {
      importo: residuo.toFixed(2),
      data: new Date().toISOString().slice(0, 10),
      metodo: "contanti",
      contoId: conti[0]?.id ?? "",
      note: "",
    },
  });

  async function onSubmit(dati: DatiPagamento) {
    const esito = await registraPagamentoQuota(quota.id, dati);
    if ("errore" in esito) {
      toast.error(esito.errore);
      return;
    }
    toast.success("Pagamento registrato e ricevuta emessa.");
    setAperto(false);
    router.refresh();
  }

  return (
    <Dialog open={aperto} onOpenChange={setAperto}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Euro /> Registra pagamento
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registra pagamento — {quota.tipoQuota.descrizione}</DialogTitle>
          <DialogDescription>
            Residuo dovuto: {formattaEuro(residuo)}. Genera automaticamente movimento di prima
            nota e ricevuta.
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="space-y-2">
            <Label htmlFor="importo">Importo</Label>
            <Input id="importo" type="number" step="0.01" {...register("importo")} />
            {errors.importo && <p className="text-sm text-destructive">{errors.importo.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="data">Data</Label>
            <Input id="data" type="date" {...register("data")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="metodo">Metodo</Label>
            <Controller
              control={control}
              name="metodo"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="metodo" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {METODI_PAGAMENTO.map((m) => (
                      <SelectItem key={m} value={m}>
                        {ETICHETTE_METODI_PAGAMENTO[m]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contoId">Conto di destinazione</Label>
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
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="animate-spin" />}
              Registra e genera ricevuta
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function QuoteSection({
  personaId,
  quote,
  tipiQuota,
  conti,
}: {
  personaId: string;
  quote: QuotaConPagamenti[];
  tipiQuota: TipoQuotaOpzione[];
  conti: ContoOpzione[];
}) {
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <DialogNuovaQuota personaId={personaId} tipiQuota={tipiQuota} />
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Tipo quota</TableHead>
            <TableHead>Scadenza</TableHead>
            <TableHead>Stato</TableHead>
            <TableHead className="text-right">Importo</TableHead>
            <TableHead>Ricevute</TableHead>
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
              <TableCell className="font-medium">{quota.tipoQuota.descrizione}</TableCell>
              <TableCell>{new Intl.DateTimeFormat("it-IT").format(quota.scadenza)}</TableCell>
              <TableCell>
                <Badge variant={VARIANTE_STATO[quota.stato] ?? "outline"}>{quota.stato}</Badge>
              </TableCell>
              <TableCell className="text-right">{formattaEuro(quota.importo)}</TableCell>
              <TableCell className="space-x-1">
                {quota.pagamenti
                  .filter((p) => p.ricevuta)
                  .map((p) => (
                    <a
                      key={p.id}
                      href={`/contabilita/ricevute/${p.ricevuta!.id}/pdf`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                    >
                      <FileText className="size-3" />
                      {p.ricevuta!.numero}/{p.ricevuta!.annoSolare}
                    </a>
                  ))}
              </TableCell>
              <TableCell className="text-right">
                {(quota.stato === "da_pagare" || quota.stato === "parziale") && (
                  <DialogRegistraPagamento quota={quota} conti={conti} />
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
