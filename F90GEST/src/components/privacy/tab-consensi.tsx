"use client";

import { useState, useTransition } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Ban } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
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
  schemaRevocaConsenso,
  ETICHETTE_TIPI_CONSENSO,
  MODALITA_REVOCA_CONSENSO,
  ETICHETTE_MODALITA_REVOCA,
  type DatiRevocaConsenso,
} from "@/lib/validazioni/privacy";
import { ottieniConsensiPersona, revocaConsenso } from "@/lib/consenso/actions";

type PersonaOpzione = { id: string; nome: string; cognome: string };
type ConsensoRiga = {
  tipo: string;
  ultimo: { stato: string; data: Date; modalita: string } | null;
};

function DialogRevoca({ personaId, tipo, onRevocato }: { personaId: string; tipo: string; onRevocato: () => void }) {
  const [aperto, setAperto] = useState(false);
  const {
    handleSubmit,
    control,
    formState: { isSubmitting },
  } = useForm<DatiRevocaConsenso>({
    resolver: zodResolver(schemaRevocaConsenso),
    defaultValues: { personaId, tipo, modalita: "cartaceo_firmato_scansionato" },
  });

  async function onSubmit(dati: DatiRevocaConsenso) {
    const esito = await revocaConsenso(dati);
    if ("errore" in esito) {
      toast.error(esito.errore);
      return;
    }
    toast.success("Consenso revocato.");
    setAperto(false);
    onRevocato();
  }

  return (
    <Dialog open={aperto} onOpenChange={setAperto}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Ban /> Revoca
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Revoca il consenso: {ETICHETTE_TIPI_CONSENSO[tipo] ?? tipo}</DialogTitle>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="space-y-2">
            <Label htmlFor="modalita">Modalità con cui è stata ricevuta la richiesta</Label>
            <Controller
              control={control}
              name="modalita"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="modalita" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MODALITA_REVOCA_CONSENSO.map((m) => (
                      <SelectItem key={m} value={m}>
                        {ETICHETTE_MODALITA_REVOCA[m]}
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
              Conferma revoca
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function TabConsensi({ persone }: { persone: PersonaOpzione[] }) {
  const [personaId, setPersonaId] = useState<string>("");
  const [consensi, setConsensi] = useState<ConsensoRiga[] | null>(null);
  const [inCaricamento, startTransition] = useTransition();

  function caricaConsensi(id: string) {
    setPersonaId(id);
    startTransition(async () => {
      const risultato = await ottieniConsensiPersona(id);
      setConsensi(risultato);
    });
  }

  return (
    <Card>
      <CardContent className="space-y-4 pt-6">
        <div className="max-w-sm space-y-2">
          <Label htmlFor="personaConsensi">Persona</Label>
          <Select value={personaId} onValueChange={caricaConsensi}>
            <SelectTrigger id="personaConsensi" className="w-full">
              <SelectValue placeholder="Cerca una persona" />
            </SelectTrigger>
            <SelectContent>
              {persone.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.cognome} {p.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {inCaricamento && <Loader2 className="animate-spin text-muted-foreground" />}

        {!inCaricamento && consensi && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tipo di consenso</TableHead>
                <TableHead>Stato attuale</TableHead>
                <TableHead>Ultimo aggiornamento</TableHead>
                <TableHead className="text-right">Azioni</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {consensi.map((c) => (
                <TableRow key={c.tipo}>
                  <TableCell className="font-medium">{ETICHETTE_TIPI_CONSENSO[c.tipo] ?? c.tipo}</TableCell>
                  <TableCell>
                    {c.ultimo ? (
                      <Badge variant={c.ultimo.stato === "concesso" ? "default" : "outline"}>{c.ultimo.stato}</Badge>
                    ) : (
                      <Badge variant="outline">mai registrato</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {c.ultimo ? new Intl.DateTimeFormat("it-IT").format(c.ultimo.data) : "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    {c.ultimo && c.ultimo.stato !== "revocato" && (
                      <DialogRevoca personaId={personaId} tipo={c.tipo} onRevocato={() => caricaConsensi(personaId)} />
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
