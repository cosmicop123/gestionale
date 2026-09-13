"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Loader2, Euro, FileText } from "lucide-react";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  schemaPagamento,
  METODI_PAGAMENTO,
  ETICHETTE_METODI_PAGAMENTO,
  type DatiPagamento,
} from "@/lib/validazioni/contabilita";
import { generaQuotaIscrizioneCorso } from "@/lib/iscrizione-corso/quota";
import { registraPagamentoQuota } from "@/lib/pagamento/actions";

type ContoOpzione = { id: string; nome: string };
type Pagamento = { id: string; importo: unknown; ricevuta: { id: string; numero: number; annoSolare: number } | null };
type QuotaIscrizione = { id: string; importo: unknown; stato: string; pagamenti: Pagamento[] } | null;

const VARIANTE_STATO_QUOTA: Record<string, "success" | "warning" | "secondary" | "outline" | "destructive"> = {
  pagata: "success",
  parziale: "warning",
  da_pagare: "outline",
  esente: "secondary",
  stornata: "destructive",
};

function formattaEuro(valore: unknown): string {
  return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(Number(valore));
}

function DialogPagamento({ quota, conti }: { quota: NonNullable<QuotaIscrizione>; conti: ContoOpzione[] }) {
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
        <Button size="sm" disabled={conti.length === 0}>
          <Euro /> Incassa
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registra il pagamento della quota di iscrizione</DialogTitle>
          <DialogDescription>
            Residuo dovuto: {formattaEuro(residuo)}. Genera automaticamente movimento di prima nota e ricevuta.
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="space-y-2">
            <Label htmlFor="importoQuotaCorso">Importo</Label>
            <Input id="importoQuotaCorso" type="number" step="0.01" {...register("importo")} />
            {errors.importo && <p className="text-sm text-destructive">{errors.importo.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="dataQuotaCorso">Data</Label>
            <Input id="dataQuotaCorso" type="date" {...register("data")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="metodoQuotaCorso">Metodo</Label>
            <Controller
              control={control}
              name="metodo"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="metodoQuotaCorso" className="w-full">
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
            <Label htmlFor="contoQuotaCorso">Conto di destinazione</Label>
            <Controller
              control={control}
              name="contoId"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="contoQuotaCorso" className="w-full">
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

export function QuotaIscrizioneCella({
  iscrizioneId,
  quota,
  conti,
  quotaPartecipazione,
  puoGestireIncassi,
}: {
  iscrizioneId: string;
  quota: QuotaIscrizione;
  conti: ContoOpzione[];
  quotaPartecipazione: number | null;
  puoGestireIncassi: boolean;
}) {
  const router = useRouter();
  const [inCorso, setInCorso] = useState(false);

  async function onGenera() {
    setInCorso(true);
    const esito = await generaQuotaIscrizioneCorso(iscrizioneId);
    setInCorso(false);
    if ("errore" in esito) {
      toast.error(esito.errore);
      return;
    }
    toast.success("Quota generata.");
    router.refresh();
  }

  if (!quotaPartecipazione) {
    return <span className="text-muted-foreground">Gratuito</span>;
  }

  if (!quota) {
    return puoGestireIncassi ? (
      <Button variant="outline" size="sm" onClick={onGenera} disabled={inCorso}>
        {inCorso && <Loader2 className="animate-spin" />}
        Genera quota
      </Button>
    ) : (
      <span className="text-muted-foreground">Da generare</span>
    );
  }

  const ricevute = quota.pagamenti.filter((p) => p.ricevuta);

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <Badge variant={VARIANTE_STATO_QUOTA[quota.stato] ?? "outline"}>{quota.stato}</Badge>
      {ricevute.map((p) => (
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
      {puoGestireIncassi && (quota.stato === "da_pagare" || quota.stato === "parziale") && (
        <DialogPagamento quota={quota} conti={conti} />
      )}
    </div>
  );
}
