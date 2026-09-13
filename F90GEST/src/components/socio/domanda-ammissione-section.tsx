"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  CATEGORIE_SOCIO,
  ETICHETTE_CATEGORIE_SOCIO,
  schemaDomandaAmmissione,
  schemaApprovazioneDomanda,
  schemaRigettoDomanda,
  type DatiDomandaAmmissione,
  type DatiApprovazioneDomanda,
} from "@/lib/validazioni/socio";
import {
  creaDomandaAmmissione,
  approvaDomandaAmmissione,
  rigettaDomandaAmmissione,
} from "@/lib/socio/actions";

const oggi = () => new Date().toISOString().slice(0, 10);

function SelettoreCategoria({
  value,
  onChange,
  id,
}: {
  value: string;
  onChange: (v: string) => void;
  id: string;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger id={id} className="w-full">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {CATEGORIE_SOCIO.map((categoria) => (
          <SelectItem key={categoria} value={categoria}>
            {ETICHETTE_CATEGORIE_SOCIO[categoria]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function NuovaDomandaAmmissione({ personaId }: { personaId: string }) {
  const router = useRouter();
  const [aperto, setAperto] = useState(false);
  const { register, handleSubmit, control, formState: { isSubmitting } } = useForm<DatiDomandaAmmissione>({
    resolver: zodResolver(schemaDomandaAmmissione),
    defaultValues: { personaId, dataDomanda: oggi(), categoriaProposta: "ordinario", note: "" },
  });

  async function onSubmit(dati: DatiDomandaAmmissione) {
    const esito = await creaDomandaAmmissione(dati);
    if ("errore" in esito) {
      toast.error(esito.errore);
      return;
    }
    toast.success("Domanda di ammissione registrata.");
    setAperto(false);
    router.refresh();
  }

  return (
    <Dialog open={aperto} onOpenChange={setAperto}>
      <DialogTrigger asChild>
        <Button>Avvia domanda di ammissione</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nuova domanda di ammissione</DialogTitle>
          <DialogDescription>
            Il numero di libro soci verrà assegnato solo alla delibera del direttivo.
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="space-y-2">
            <Label htmlFor="dataDomanda">Data della domanda</Label>
            <Input id="dataDomanda" type="date" {...register("dataDomanda")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="categoriaProposta">Categoria proposta</Label>
            <Controller
              control={control}
              name="categoriaProposta"
              render={({ field }) => (
                <SelettoreCategoria id="categoriaProposta" value={field.value} onChange={field.onChange} />
              )}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="note">Note</Label>
            <Textarea id="note" rows={2} {...register("note")} />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="animate-spin" />}
              Registra domanda
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

type DomandaInValutazione = {
  id: string;
  dataDomanda: Date;
  categoriaProposta: string;
  note: string | null;
};

export function DomandaInValutazioneCard({ domanda }: { domanda: DomandaInValutazione }) {
  const router = useRouter();
  const [dialogApprovaAperto, setDialogApprovaAperto] = useState(false);
  const [dialogRigettaAperto, setDialogRigettaAperto] = useState(false);

  const {
    register: registraApprova,
    handleSubmit: handleSubmitApprova,
    control: controlApprova,
    formState: { isSubmitting: inAttesaApprova },
  } = useForm<DatiApprovazioneDomanda>({
    resolver: zodResolver(schemaApprovazioneDomanda),
    defaultValues: {
      dataDelibera: oggi(),
      dataDecorrenza: oggi(),
      categoria: domanda.categoriaProposta as DatiApprovazioneDomanda["categoria"],
    },
  });

  const {
    register: registraRigetta,
    handleSubmit: handleSubmitRigetta,
    formState: { isSubmitting: inAttesaRigetta },
  } = useForm<{ motivoRigetto: string }>({ resolver: zodResolver(schemaRigettoDomanda) });

  async function onApprova(dati: DatiApprovazioneDomanda) {
    const esito = await approvaDomandaAmmissione(domanda.id, dati);
    if ("errore" in esito) {
      toast.error(esito.errore);
      return;
    }
    toast.success("Domanda approvata: socio iscritto nel libro soci.");
    setDialogApprovaAperto(false);
    router.refresh();
  }

  async function onRigetta(dati: { motivoRigetto: string }) {
    const esito = await rigettaDomandaAmmissione(domanda.id, dati);
    if ("errore" in esito) {
      toast.error(esito.errore);
      return;
    }
    toast.success("Domanda respinta.");
    setDialogRigettaAperto(false);
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          Domanda di ammissione <Badge variant="warning">in valutazione</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <dl className="grid grid-cols-2 gap-2 text-sm">
          <dt className="text-muted-foreground">Data domanda</dt>
          <dd>{new Intl.DateTimeFormat("it-IT").format(domanda.dataDomanda)}</dd>
          <dt className="text-muted-foreground">Categoria proposta</dt>
          <dd>{ETICHETTE_CATEGORIE_SOCIO[domanda.categoriaProposta as keyof typeof ETICHETTE_CATEGORIE_SOCIO]}</dd>
          {domanda.note && (
            <>
              <dt className="text-muted-foreground">Note</dt>
              <dd>{domanda.note}</dd>
            </>
          )}
        </dl>
        <div className="flex gap-2">
          <Dialog open={dialogApprovaAperto} onOpenChange={setDialogApprovaAperto}>
            <DialogTrigger asChild>
              <Button>Approva (delibera direttivo)</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Approva la domanda di ammissione</DialogTitle>
                <DialogDescription>
                  Assegna il numero di libro soci e iscrive la persona come socio, con stato
                  iniziale &quot;in attesa&quot; fino al pagamento della quota.
                </DialogDescription>
              </DialogHeader>
              <form className="space-y-4" onSubmit={handleSubmitApprova(onApprova)} noValidate>
                <div className="space-y-2">
                  <Label htmlFor="dataDelibera">Data delibera del direttivo</Label>
                  <Input id="dataDelibera" type="date" {...registraApprova("dataDelibera")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dataDecorrenza">Data decorrenza iscrizione</Label>
                  <Input id="dataDecorrenza" type="date" {...registraApprova("dataDecorrenza")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="categoria">Categoria socio</Label>
                  <Controller
                    control={controlApprova}
                    name="categoria"
                    render={({ field }) => (
                      <SelettoreCategoria id="categoria" value={field.value} onChange={field.onChange} />
                    )}
                  />
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={inAttesaApprova}>
                    {inAttesaApprova && <Loader2 className="animate-spin" />}
                    Conferma approvazione
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={dialogRigettaAperto} onOpenChange={setDialogRigettaAperto}>
            <DialogTrigger asChild>
              <Button variant="outline">Respingi</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Respingi la domanda di ammissione</DialogTitle>
              </DialogHeader>
              <form className="space-y-4" onSubmit={handleSubmitRigetta(onRigetta)} noValidate>
                <div className="space-y-2">
                  <Label htmlFor="motivoRigetto">Motivo</Label>
                  <Textarea id="motivoRigetto" rows={3} {...registraRigetta("motivoRigetto")} />
                </div>
                <DialogFooter>
                  <Button type="submit" variant="destructive" disabled={inAttesaRigetta}>
                    {inAttesaRigetta && <Loader2 className="animate-spin" />}
                    Conferma rigetto
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  );
}
