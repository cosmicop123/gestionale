"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import type { TipoQuota } from "@prisma/client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
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
import { schemaTipoQuota, type DatiTipoQuota } from "@/lib/validazioni/contabilita";
import { CATEGORIE_SOCIO, ETICHETTE_CATEGORIE_SOCIO } from "@/lib/validazioni/socio";
import { creaTipoQuota } from "@/lib/tipo-quota/actions";

const NATURE_FISCALI = [
  "quota_associativa",
  "corrispettivo_specifico",
  "erogazione_liberale",
  "contributo_pubblico",
  "contributo_privato",
  "sponsorizzazione",
  "raccolta_fondi_occasionale",
  "attivita_commerciale",
] as const;

const ETICHETTE_NATURA_FISCALE: Record<string, string> = {
  quota_associativa: "Quota associativa",
  corrispettivo_specifico: "Corrispettivo specifico",
  erogazione_liberale: "Erogazione liberale",
  contributo_pubblico: "Contributo pubblico",
  contributo_privato: "Contributo privato",
  sponsorizzazione: "Sponsorizzazione",
  raccolta_fondi_occasionale: "Raccolta fondi occasionale",
  attivita_commerciale: "Attività commerciale",
};

function formattaEuro(valore: number): string {
  return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(valore);
}

export function TabTipiQuota({
  tipiQuota,
  annoSocialeAperto,
  puoScrivere,
}: {
  tipiQuota: TipoQuota[];
  annoSocialeAperto: boolean;
  puoScrivere: boolean;
}) {
  const [aperto, setAperto] = useState(false);
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<DatiTipoQuota>({
    resolver: zodResolver(schemaTipoQuota),
    defaultValues: {
      descrizione: "",
      importo: "",
      categoriaSocioApplicabile: "",
      naturaFiscale: "quota_associativa",
      ricorrente: true,
    },
  });

  async function onSubmit(dati: DatiTipoQuota) {
    const esito = await creaTipoQuota(dati);
    if ("errore" in esito) {
      toast.error(esito.errore);
      return;
    }
    toast.success("Tipo di quota creato.");
    reset();
    setAperto(false);
  }

  return (
    <Card>
      <CardContent className="space-y-4 pt-6">
        <p className="text-sm text-muted-foreground">
          <strong>Attenzione</strong> alla natura fiscale (§7.3): un corso o servizio a pagamento
          non è una quota associativa pura. Il gestionale non fornisce consulenza fiscale.
        </p>
        {puoScrivere && (
          <div className="flex justify-end">
            <Dialog open={aperto} onOpenChange={setAperto}>
              <DialogTrigger asChild>
                <Button size="sm" disabled={!annoSocialeAperto}>
                  <Plus /> Nuovo tipo di quota
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Nuovo tipo di quota</DialogTitle>
                </DialogHeader>
                <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
                  <div className="space-y-2">
                    <Label htmlFor="descrizione">Descrizione</Label>
                    <Input id="descrizione" placeholder="Quota associativa 2026/2027" {...register("descrizione")} />
                    {errors.descrizione && (
                      <p className="text-sm text-destructive">{errors.descrizione.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="importo">Importo</Label>
                    <Input id="importo" type="number" step="0.01" {...register("importo")} />
                    {errors.importo && <p className="text-sm text-destructive">{errors.importo.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="naturaFiscale">Natura fiscale</Label>
                    <Controller
                      control={control}
                      name="naturaFiscale"
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger id="naturaFiscale" className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {NATURE_FISCALI.map((n) => (
                              <SelectItem key={n} value={n}>
                                {ETICHETTE_NATURA_FISCALE[n]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="categoriaSocioApplicabile">Categoria socio applicabile</Label>
                    <Controller
                      control={control}
                      name="categoriaSocioApplicabile"
                      render={({ field }) => (
                        <Select value={field.value || "tutte"} onValueChange={(v) => field.onChange(v === "tutte" ? "" : v)}>
                          <SelectTrigger id="categoriaSocioApplicabile" className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="tutte">Tutte le categorie</SelectItem>
                            {CATEGORIE_SOCIO.map((c) => (
                              <SelectItem key={c} value={c}>
                                {ETICHETTE_CATEGORIE_SOCIO[c]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                  <Controller
                    control={control}
                    name="ricorrente"
                    render={({ field }) => (
                      <div className="flex items-center gap-3">
                        <Checkbox
                          id="ricorrente"
                          checked={field.value}
                          onCheckedChange={(v) => field.onChange(v === true)}
                        />
                        <Label htmlFor="ricorrente">Quota ricorrente ogni anno sociale</Label>
                      </div>
                    )}
                  />
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
              <TableHead>Descrizione</TableHead>
              <TableHead>Natura fiscale</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead className="text-right">Importo</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tipiQuota.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">
                  Nessun tipo di quota per l&apos;anno sociale corrente.
                </TableCell>
              </TableRow>
            )}
            {tipiQuota.map((tipo) => (
              <TableRow key={tipo.id}>
                <TableCell className="font-medium">{tipo.descrizione}</TableCell>
                <TableCell>
                  <Badge variant="outline">{ETICHETTE_NATURA_FISCALE[tipo.naturaFiscale] ?? tipo.naturaFiscale}</Badge>
                </TableCell>
                <TableCell>
                  {tipo.categoriaSocioApplicabile
                    ? (ETICHETTE_CATEGORIE_SOCIO[tipo.categoriaSocioApplicabile as keyof typeof ETICHETTE_CATEGORIE_SOCIO] ?? tipo.categoriaSocioApplicabile)
                    : "Tutte"}
                </TableCell>
                <TableCell className="text-right">{formattaEuro(Number(tipo.importo))}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
