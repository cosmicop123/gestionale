"use client";

import { useState } from "react";
import { useForm, Controller, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Trash2, Upload, Download } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  schemaPraticaSiae,
  schemaBranoProgramma,
  STATI_PRATICA_SIAE,
  ETICHETTE_STATI_PRATICA_SIAE,
  type DatiPraticaSiae,
  type DatiBranoProgramma,
} from "@/lib/validazioni/evento";
import { salvaPraticaSiae, caricaBorderoPraticaSiae, aggiungiBranoAProgramma, rimuoviBranoDaProgramma } from "@/lib/pratica-siae/actions";

type BranoOpzione = { id: string; titolo: string; autore: string };
type ProgrammaRiga = { id: string; ordineEsecuzione: number | null; brano: BranoOpzione };
type Pratica = {
  id: string;
  tipoPermesso: string;
  dataInvio: Date | null;
  protocollo: string | null;
  minimoGarantito: unknown;
  importoPagato: unknown;
  conguaglio: unknown;
  stato: string;
  borderoAllegatoId: string | null;
  programmaMusicale: ProgrammaRiga[];
} | null;

function formattaDataInput(data: Date | null): string {
  return data ? new Date(data).toISOString().slice(0, 10) : "";
}

function FormPratica({ eventoId, pratica }: { eventoId: string; pratica: Pratica }) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<DatiPraticaSiae>({
    resolver: zodResolver(schemaPraticaSiae),
    defaultValues: {
      tipoPermesso: pratica?.tipoPermesso ?? "",
      dataInvio: formattaDataInput(pratica?.dataInvio ?? null),
      protocollo: pratica?.protocollo ?? "",
      minimoGarantito: pratica?.minimoGarantito ? String(pratica.minimoGarantito) : "",
      importoPagato: pratica?.importoPagato ? String(pratica.importoPagato) : "",
      conguaglio: pratica?.conguaglio ? String(pratica.conguaglio) : "",
      stato: (pratica?.stato as DatiPraticaSiae["stato"]) ?? "da_predisporre",
    },
  });
  const [inCaricamento, setInCaricamento] = useState(false);

  async function onSubmit(dati: DatiPraticaSiae) {
    const esito = await salvaPraticaSiae(eventoId, dati);
    if ("errore" in esito) {
      toast.error(esito.errore);
      return;
    }
    toast.success("Pratica SIAE salvata.");
    router.refresh();
  }

  async function onCaricaBordero(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.set("file", file);
    setInCaricamento(true);
    const esito = await caricaBorderoPraticaSiae(eventoId, formData);
    setInCaricamento(false);
    if ("errore" in esito) {
      toast.error(esito.errore);
      return;
    }
    toast.success("Bordero caricato.");
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Pratica SIAE</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="tipoPermesso">Tipo di permesso</Label>
              <Input id="tipoPermesso" {...register("tipoPermesso")} />
              {errors.tipoPermesso && <p className="text-sm text-destructive">{errors.tipoPermesso.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="stato">Stato</Label>
              <Controller
                control={control}
                name="stato"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="stato" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATI_PRATICA_SIAE.map((s) => (
                        <SelectItem key={s} value={s}>
                          {ETICHETTE_STATI_PRATICA_SIAE[s]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dataInvio">Data invio</Label>
              <Input id="dataInvio" type="date" {...register("dataInvio")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="protocollo">Protocollo</Label>
              <Input id="protocollo" {...register("protocollo")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="minimoGarantito">Minimo garantito (€)</Label>
              <Input id="minimoGarantito" type="number" step="0.01" {...register("minimoGarantito")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="importoPagato">Importo pagato (€)</Label>
              <Input id="importoPagato" type="number" step="0.01" {...register("importoPagato")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="conguaglio">Conguaglio (€)</Label>
              <Input id="conguaglio" type="number" step="0.01" {...register("conguaglio")} />
            </div>
          </div>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="animate-spin" />}
            Salva pratica
          </Button>
        </form>

        {pratica && (
          <div className="mt-4 flex items-center gap-3 border-t pt-4">
            <Label htmlFor="bordero" className="cursor-pointer">
              <span className="inline-flex items-center gap-2 text-sm text-primary">
                {inCaricamento ? <Loader2 className="animate-spin" /> : <Upload />}
                Carica bordero incassi
              </span>
              <input id="bordero" type="file" className="hidden" onChange={onCaricaBordero} disabled={inCaricamento} />
            </Label>
            {pratica.borderoAllegatoId && (
              <Button variant="outline" size="sm" asChild>
                <a href={`/contabilita/allegati/${pratica.borderoAllegatoId}`} target="_blank" rel="noopener noreferrer">
                  <Download /> Bordero caricato
                </a>
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function DialogAggiungiBrano({
  eventoId,
  archivioBrani,
}: {
  eventoId: string;
  archivioBrani: BranoOpzione[];
}) {
  const router = useRouter();
  const [aperto, setAperto] = useState(false);
  const { handleSubmit, control, register, formState: { errors, isSubmitting } } = useForm<DatiBranoProgramma>({
    resolver: zodResolver(schemaBranoProgramma),
    defaultValues: { branoEsistenteId: "", titolo: "", autore: "", editore: "", ordineEsecuzione: "" },
  });
  const branoEsistenteId = useWatch({ control, name: "branoEsistenteId" });

  async function onSubmit(dati: DatiBranoProgramma) {
    const esito = await aggiungiBranoAProgramma(eventoId, dati);
    if ("errore" in esito) {
      toast.error(esito.errore);
      return;
    }
    toast.success("Brano aggiunto al programma.");
    setAperto(false);
    router.refresh();
  }

  return (
    <Dialog open={aperto} onOpenChange={setAperto}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus /> Aggiungi brano
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Aggiungi un brano al programma musicale</DialogTitle>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
          {archivioBrani.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="branoEsistenteId">Dall&apos;archivio</Label>
              <Controller
                control={control}
                name="branoEsistenteId"
                render={({ field }) => (
                  <Select value={field.value || undefined} onValueChange={field.onChange}>
                    <SelectTrigger id="branoEsistenteId" className="w-full">
                      <SelectValue placeholder="Nessuno — inserisci un brano nuovo" />
                    </SelectTrigger>
                    <SelectContent>
                      {archivioBrani.map((b) => (
                        <SelectItem key={b.id} value={b.id}>
                          {b.titolo} — {b.autore}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          )}
          {!branoEsistenteId && (
            <>
              <div className="space-y-2">
                <Label htmlFor="titolo">Titolo</Label>
                <Input id="titolo" {...register("titolo")} />
                {errors.titolo && <p className="text-sm text-destructive">{errors.titolo.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="autore">Autore</Label>
                <Input id="autore" {...register("autore")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editore">Editore</Label>
                <Input id="editore" {...register("editore")} />
              </div>
            </>
          )}
          <div className="space-y-2">
            <Label htmlFor="ordineEsecuzione">Ordine di esecuzione</Label>
            <Input id="ordineEsecuzione" type="number" min="1" {...register("ordineEsecuzione")} />
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

export function TabSiae({
  eventoId,
  pratica,
  archivioBrani,
  puoGestire,
}: {
  eventoId: string;
  pratica: Pratica;
  archivioBrani: BranoOpzione[];
  puoGestire: boolean;
}) {
  const router = useRouter();

  async function onRimuoviBrano(programmaId: string) {
    const esito = await rimuoviBranoDaProgramma(eventoId, programmaId);
    if ("errore" in esito) {
      toast.error(esito.errore);
      return;
    }
    router.refresh();
  }

  if (!puoGestire && !pratica) {
    return <p className="text-sm text-muted-foreground">Nessuna pratica SIAE predisposta per questo evento.</p>;
  }

  return (
    <div className="space-y-4">
      {puoGestire ? (
        <FormPratica eventoId={eventoId} pratica={pratica} />
      ) : (
        pratica && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Pratica SIAE</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              {pratica.tipoPermesso} — {ETICHETTE_STATI_PRATICA_SIAE[pratica.stato as keyof typeof ETICHETTE_STATI_PRATICA_SIAE] ?? pratica.stato}
            </CardContent>
          </Card>
        )
      )}

      {pratica && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Programma musicale</CardTitle>
            {puoGestire && <DialogAggiungiBrano eventoId={eventoId} archivioBrani={archivioBrani} />}
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ordine</TableHead>
                  <TableHead>Titolo</TableHead>
                  <TableHead>Autore</TableHead>
                  {puoGestire && <TableHead className="text-right">Azioni</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {pratica.programmaMusicale.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={puoGestire ? 4 : 3} className="text-center text-muted-foreground">
                      Nessun brano nel programma.
                    </TableCell>
                  </TableRow>
                )}
                {pratica.programmaMusicale.map((riga) => (
                  <TableRow key={riga.id}>
                    <TableCell>{riga.ordineEsecuzione ?? "—"}</TableCell>
                    <TableCell className="font-medium">{riga.brano.titolo}</TableCell>
                    <TableCell className="text-muted-foreground">{riga.brano.autore}</TableCell>
                    {puoGestire && (
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => onRimuoviBrano(riga.id)}>
                          <Trash2 className="text-destructive" />
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
