"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Download, FileCheck } from "lucide-react";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  schemaRichiestaInteressato,
  schemaEvasioneRichiesta,
  TIPI_RICHIESTA_INTERESSATO,
  ETICHETTE_TIPI_RICHIESTA_INTERESSATO,
  type DatiRichiestaInteressato,
  type DatiEvasioneRichiesta,
} from "@/lib/validazioni/privacy";
import {
  registraRichiestaInteressato,
  generaEsportazioneRichiesta,
  evadiRichiestaInteressato,
} from "@/lib/richiesta-interessato/actions";

type PersonaOpzione = { id: string; nome: string; cognome: string };
type RichiestaRiga = {
  id: string;
  tipo: string;
  dataRichiesta: Date;
  esito: string | null;
  dataEvasione: Date | null;
  exportAllegatoId: string | null;
  persona: { nome: string; cognome: string };
};

function DialogNuovaRichiesta({ persone }: { persone: PersonaOpzione[] }) {
  const router = useRouter();
  const [aperto, setAperto] = useState(false);
  const {
    handleSubmit,
    control,
    register,
    formState: { errors, isSubmitting },
  } = useForm<DatiRichiestaInteressato>({
    resolver: zodResolver(schemaRichiestaInteressato),
    defaultValues: { personaId: "", tipo: "accesso", dataRichiesta: new Date().toISOString().slice(0, 10) },
  });

  async function onSubmit(dati: DatiRichiestaInteressato) {
    const esito = await registraRichiestaInteressato(dati);
    if ("errore" in esito) {
      toast.error(esito.errore);
      return;
    }
    toast.success("Richiesta registrata.");
    setAperto(false);
    router.refresh();
  }

  return (
    <Dialog open={aperto} onOpenChange={setAperto}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus /> Nuova richiesta
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registra una richiesta dell&apos;interessato</DialogTitle>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="space-y-2">
            <Label htmlFor="personaId">Persona</Label>
            <Controller
              control={control}
              name="personaId"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="personaId" className="w-full">
                    <SelectValue placeholder="Seleziona una persona" />
                  </SelectTrigger>
                  <SelectContent>
                    {persone.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.cognome} {p.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.personaId && <p className="text-sm text-destructive">{errors.personaId.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="tipo">Tipo di richiesta</Label>
            <Controller
              control={control}
              name="tipo"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="tipo" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIPI_RICHIESTA_INTERESSATO.map((t) => (
                      <SelectItem key={t} value={t}>
                        {ETICHETTE_TIPI_RICHIESTA_INTERESSATO[t]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dataRichiesta">Data della richiesta</Label>
            <Input id="dataRichiesta" type="date" {...register("dataRichiesta")} />
            {errors.dataRichiesta && <p className="text-sm text-destructive">{errors.dataRichiesta.message}</p>}
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

function DialogEvadiRichiesta({ richiestaId }: { richiestaId: string }) {
  const router = useRouter();
  const [aperto, setAperto] = useState(false);
  const {
    handleSubmit,
    register,
    formState: { errors, isSubmitting },
  } = useForm<DatiEvasioneRichiesta>({ resolver: zodResolver(schemaEvasioneRichiesta), defaultValues: { esito: "" } });

  async function onSubmit(dati: DatiEvasioneRichiesta) {
    const esito = await evadiRichiestaInteressato(richiestaId, dati);
    if ("errore" in esito) {
      toast.error(esito.errore);
      return;
    }
    toast.success("Esito registrato.");
    setAperto(false);
    router.refresh();
  }

  return (
    <Dialog open={aperto} onOpenChange={setAperto}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <FileCheck /> Registra esito
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Esito della richiesta</DialogTitle>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="space-y-2">
            <Label htmlFor="esito">Descrizione dell&apos;esito</Label>
            <Textarea id="esito" rows={4} {...register("esito")} />
            {errors.esito && <p className="text-sm text-destructive">{errors.esito.message}</p>}
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="animate-spin" />}
              Salva esito
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function BottoneEsportazione({ richiestaId, exportAllegatoId }: { richiestaId: string; exportAllegatoId: string | null }) {
  const router = useRouter();
  const [inAttesa, setInAttesa] = useState(false);

  if (exportAllegatoId) {
    return (
      <Button variant="outline" size="sm" asChild>
        <a href={`/contabilita/allegati/${exportAllegatoId}`} target="_blank" rel="noopener noreferrer">
          <Download /> Scarica dati
        </a>
      </Button>
    );
  }

  async function onGenera() {
    setInAttesa(true);
    const esito = await generaEsportazioneRichiesta(richiestaId);
    setInAttesa(false);
    if ("errore" in esito) {
      toast.error(esito.errore);
      return;
    }
    router.refresh();
  }

  return (
    <Button variant="outline" size="sm" onClick={onGenera} disabled={inAttesa}>
      {inAttesa && <Loader2 className="animate-spin" />}
      Genera esportazione
    </Button>
  );
}

export function TabRichiesteInteressato({ richieste, persone }: { richieste: RichiestaRiga[]; persone: PersonaOpzione[] }) {
  return (
    <Card>
      <CardContent className="space-y-4 pt-6">
        <div className="flex justify-end">
          <DialogNuovaRichiesta persone={persone} />
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Persona</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Data richiesta</TableHead>
              <TableHead>Esito</TableHead>
              <TableHead className="text-right">Azioni</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {richieste.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  Nessuna richiesta registrata.
                </TableCell>
              </TableRow>
            )}
            {richieste.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">
                  {r.persona.cognome} {r.persona.nome}
                </TableCell>
                <TableCell>{ETICHETTE_TIPI_RICHIESTA_INTERESSATO[r.tipo as keyof typeof ETICHETTE_TIPI_RICHIESTA_INTERESSATO] ?? r.tipo}</TableCell>
                <TableCell className="text-muted-foreground">{new Intl.DateTimeFormat("it-IT").format(r.dataRichiesta)}</TableCell>
                <TableCell>
                  {r.esito ? (
                    <Badge variant="default" title={r.esito}>
                      Evasa
                    </Badge>
                  ) : (
                    <Badge variant="outline">In attesa</Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    {r.tipo === "accesso" && <BottoneEsportazione richiestaId={r.id} exportAllegatoId={r.exportAllegatoId} />}
                    {!r.esito && <DialogEvadiRichiesta richiestaId={r.id} />}
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
