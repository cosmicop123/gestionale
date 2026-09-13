"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Loader2, Trash2, UserPlus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
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
import { schemaDocenteCorso, type DatiDocenteCorso } from "@/lib/validazioni/corso";
import { aggiungiDocente, rimuoviDocente } from "@/lib/corso/actions";

type PersonaOpzione = { id: string; nome: string; cognome: string };
type CorsoDocenteRiga = { id: string; persona: { id: string; nome: string; cognome: string } };

export function TabDocenti({
  corsoId,
  docenti,
  persone,
  puoGestire,
}: {
  corsoId: string;
  docenti: CorsoDocenteRiga[];
  persone: PersonaOpzione[];
  puoGestire: boolean;
}) {
  const router = useRouter();
  const [aperto, setAperto] = useState(false);
  const { handleSubmit, control, formState: { isSubmitting } } = useForm<DatiDocenteCorso>({
    resolver: zodResolver(schemaDocenteCorso),
    defaultValues: { personaId: "" },
  });

  const personeDisponibili = persone.filter((p) => !docenti.some((d) => d.persona.id === p.id));

  async function onSubmit(dati: DatiDocenteCorso) {
    const esito = await aggiungiDocente(corsoId, dati);
    if ("errore" in esito) {
      toast.error(esito.errore);
      return;
    }
    toast.success("Docente aggiunto.");
    setAperto(false);
    router.refresh();
  }

  async function onRimuovi(corsoDocenteId: string) {
    const esito = await rimuoviDocente(corsoId, corsoDocenteId);
    if ("errore" in esito) {
      toast.error(esito.errore);
      return;
    }
    router.refresh();
  }

  return (
    <Card>
      <CardContent className="space-y-4 pt-6">
        {puoGestire && (
          <div className="flex justify-end">
            <Dialog open={aperto} onOpenChange={setAperto}>
              <DialogTrigger asChild>
                <Button size="sm" disabled={personeDisponibili.length === 0}>
                  <UserPlus /> Aggiungi docente
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Aggiungi docente al corso</DialogTitle>
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
                            {personeDisponibili.map((persona) => (
                              <SelectItem key={persona.id} value={persona.id}>
                                {persona.cognome} {persona.nome}
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
                      Aggiungi
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        )}

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              {puoGestire && <TableHead className="text-right">Azioni</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {docenti.length === 0 && (
              <TableRow>
                <TableCell colSpan={puoGestire ? 2 : 1} className="text-center text-muted-foreground">
                  Nessun docente assegnato.
                </TableCell>
              </TableRow>
            )}
            {docenti.map((d) => (
              <TableRow key={d.id}>
                <TableCell className="font-medium">
                  {d.persona.cognome} {d.persona.nome}
                </TableCell>
                {puoGestire && (
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => onRimuovi(d.id)}>
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
  );
}
