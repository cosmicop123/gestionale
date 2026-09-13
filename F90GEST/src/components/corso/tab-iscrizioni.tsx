"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Loader2, UserPlus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
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
  DialogDescription,
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
  schemaIscrizioneCorso,
  CANALI_ISCRIZIONE_CORSO,
  ETICHETTE_CANALI_ISCRIZIONE,
  ETICHETTE_STATI_ISCRIZIONE,
  type DatiIscrizioneCorso,
} from "@/lib/validazioni/corso";
import { iscriviPersona, ritiraIscrizione, confermaIscrizione } from "@/lib/iscrizione-corso/actions";
import { QuotaIscrizioneCella } from "./quota-iscrizione-cella";

type PersonaOpzione = { id: string; nome: string; cognome: string };
type ContoOpzione = { id: string; nome: string };
type Pagamento = { id: string; importo: unknown; ricevuta: { id: string; numero: number; annoSolare: number } | null };
type IscrizioneRiga = {
  id: string;
  stato: string;
  canale: string;
  dataIscrizione: Date;
  persona: { nome: string; cognome: string };
  quota: { id: string; importo: unknown; stato: string; pagamenti: Pagamento[] } | null;
};

const VARIANTE_STATO: Record<string, "success" | "warning" | "secondary" | "outline" | "destructive"> = {
  preiscritto: "outline",
  confermato: "success",
  in_lista_attesa: "warning",
  ritirato: "destructive",
};

function DialogNuovaIscrizione({ corsoId, persone }: { corsoId: string; persone: PersonaOpzione[] }) {
  const router = useRouter();
  const [aperto, setAperto] = useState(false);
  const {
    handleSubmit,
    control,
    register,
    formState: { isSubmitting },
  } = useForm<DatiIscrizioneCorso>({
    resolver: zodResolver(schemaIscrizioneCorso),
    defaultValues: { personaId: "", canale: "sportello", note: "" },
  });

  async function onSubmit(dati: DatiIscrizioneCorso) {
    const esito = await iscriviPersona(corsoId, dati);
    if ("errore" in esito) {
      toast.error(esito.errore);
      return;
    }
    toast.success("Iscrizione registrata.");
    setAperto(false);
    router.refresh();
  }

  return (
    <Dialog open={aperto} onOpenChange={setAperto}>
      <DialogTrigger asChild>
        <Button size="sm">
          <UserPlus /> Nuova iscrizione
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nuova iscrizione al corso</DialogTitle>
          <DialogDescription>
            Se la capienza massima è già raggiunta, l&apos;iscrizione va automaticamente in lista d&apos;attesa.
          </DialogDescription>
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
                    {persone.map((persona) => (
                      <SelectItem key={persona.id} value={persona.id}>
                        {persona.cognome} {persona.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="canale">Canale</Label>
            <Controller
              control={control}
              name="canale"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="canale" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CANALI_ISCRIZIONE_CORSO.map((c) => (
                      <SelectItem key={c} value={c}>
                        {ETICHETTE_CANALI_ISCRIZIONE[c]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
              Iscrivi
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function TabIscrizioni({
  corsoId,
  iscrizioni,
  persone,
  conti,
  capienzaMassima,
  quotaPartecipazione,
  puoGestire,
  puoGestireIncassi,
}: {
  corsoId: string;
  iscrizioni: IscrizioneRiga[];
  persone: PersonaOpzione[];
  conti: ContoOpzione[];
  capienzaMassima: number | null;
  quotaPartecipazione: number | null;
  puoGestire: boolean;
  puoGestireIncassi: boolean;
}) {
  const router = useRouter();
  const personeGiaIscritte = new Set(
    iscrizioni.filter((i) => i.stato !== "ritirato").map((i) => `${i.persona.cognome}|${i.persona.nome}`)
  );
  const personeSelezionabili = persone.filter((p) => !personeGiaIscritte.has(`${p.cognome}|${p.nome}`));

  const confermati = iscrizioni.filter((i) => i.stato === "confermato").length;

  async function onRitira(iscrizioneId: string) {
    const esito = await ritiraIscrizione(iscrizioneId);
    if ("errore" in esito) {
      toast.error(esito.errore);
      return;
    }
    toast.success("Iscrizione ritirata.");
    router.refresh();
  }

  async function onConferma(iscrizioneId: string) {
    const esito = await confermaIscrizione(iscrizioneId);
    if ("errore" in esito) {
      toast.error(esito.errore);
      return;
    }
    toast.success(esito.messaggio);
    router.refresh();
  }

  return (
    <Card>
      <CardContent className="space-y-4 pt-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            {confermati} confermati{capienzaMassima ? ` su ${capienzaMassima} posti` : ""}.
          </p>
          {puoGestire && <DialogNuovaIscrizione corsoId={corsoId} persone={personeSelezionabili} />}
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Persona</TableHead>
              <TableHead>Canale</TableHead>
              <TableHead>Data iscrizione</TableHead>
              <TableHead>Stato</TableHead>
              <TableHead className="text-right">Quota</TableHead>
              {puoGestire && <TableHead className="text-right">Azioni</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {iscrizioni.length === 0 && (
              <TableRow>
                <TableCell colSpan={puoGestire ? 6 : 5} className="text-center text-muted-foreground">
                  Nessuna iscrizione.
                </TableCell>
              </TableRow>
            )}
            {iscrizioni.map((iscrizione) => (
              <TableRow key={iscrizione.id}>
                <TableCell className="font-medium">
                  {iscrizione.persona.cognome} {iscrizione.persona.nome}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {ETICHETTE_CANALI_ISCRIZIONE[iscrizione.canale as keyof typeof ETICHETTE_CANALI_ISCRIZIONE] ??
                    iscrizione.canale}
                </TableCell>
                <TableCell>{new Intl.DateTimeFormat("it-IT").format(iscrizione.dataIscrizione)}</TableCell>
                <TableCell>
                  <Badge variant={VARIANTE_STATO[iscrizione.stato] ?? "outline"}>
                    {ETICHETTE_STATI_ISCRIZIONE[iscrizione.stato as keyof typeof ETICHETTE_STATI_ISCRIZIONE] ??
                      iscrizione.stato}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <QuotaIscrizioneCella
                    iscrizioneId={iscrizione.id}
                    quota={iscrizione.quota}
                    conti={conti}
                    quotaPartecipazione={quotaPartecipazione}
                    puoGestireIncassi={puoGestireIncassi}
                  />
                </TableCell>
                {puoGestire && (
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {(iscrizione.stato === "in_lista_attesa" || iscrizione.stato === "preiscritto") && (
                        <Button variant="outline" size="sm" onClick={() => onConferma(iscrizione.id)}>
                          Conferma
                        </Button>
                      )}
                      {iscrizione.stato !== "ritirato" && (
                        <Button variant="ghost" size="sm" onClick={() => onRitira(iscrizione.id)}>
                          Ritira
                        </Button>
                      )}
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
