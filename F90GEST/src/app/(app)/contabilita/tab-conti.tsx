"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import type { Conto } from "@prisma/client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { schemaConto, type DatiConto } from "@/lib/validazioni/contabilita";
import { creaConto } from "@/lib/conto/actions";

function formattaEuro(valore: number | null): string {
  if (valore === null) return "—";
  return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(valore);
}

type ContoConSaldo = Conto & { saldoIniziale: number | null; saldoCorrente: number | null };

export function TabConti({ conti, puoScrivere }: { conti: ContoConSaldo[]; puoScrivere: boolean }) {
  const [aperto, setAperto] = useState(false);
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<DatiConto>({
    resolver: zodResolver(schemaConto),
    defaultValues: { nome: "", tipo: "cassa", iban: "", saldoIniziale: "0" },
  });

  async function onSubmit(dati: DatiConto) {
    const esito = await creaConto(dati);
    if ("errore" in esito) {
      toast.error(esito.errore);
      return;
    }
    toast.success("Conto creato.");
    reset();
    setAperto(false);
  }

  return (
    <Card>
      <CardContent className="space-y-4 pt-6">
        {puoScrivere && (
          <div className="flex justify-end">
            <Dialog open={aperto} onOpenChange={setAperto}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus /> Nuovo conto
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Nuovo conto</DialogTitle>
                </DialogHeader>
                <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
                  <div className="space-y-2">
                    <Label htmlFor="nome">Nome</Label>
                    <Input id="nome" placeholder="Cassa contanti" {...register("nome")} />
                    {errors.nome && <p className="text-sm text-destructive">{errors.nome.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tipo">Tipo</Label>
                    <Controller
                      control={control}
                      name="tipo"
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger id="tipo" className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="cassa">Cassa contanti</SelectItem>
                            <SelectItem value="banca">Conto corrente</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="iban">IBAN (se conto corrente)</Label>
                    <Input id="iban" {...register("iban")} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="saldoIniziale">Saldo iniziale</Label>
                    <Input id="saldoIniziale" type="number" step="0.01" {...register("saldoIniziale")} />
                    {errors.saldoIniziale && (
                      <p className="text-sm text-destructive">{errors.saldoIniziale.message}</p>
                    )}
                  </div>
                  <DialogFooter>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting && <Loader2 className="animate-spin" />}
                      Crea
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
              <TableHead>Tipo</TableHead>
              <TableHead className="text-right">Saldo iniziale (anno)</TableHead>
              <TableHead className="text-right">Saldo corrente</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {conti.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">
                  Nessun conto creato.
                </TableCell>
              </TableRow>
            )}
            {conti.map((conto) => (
              <TableRow key={conto.id}>
                <TableCell className="font-medium">{conto.nome}</TableCell>
                <TableCell>{conto.tipo === "cassa" ? "Cassa contanti" : "Conto corrente"}</TableCell>
                <TableCell className="text-right">{formattaEuro(conto.saldoIniziale)}</TableCell>
                <TableCell className="text-right font-medium">{formattaEuro(conto.saldoCorrente)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
