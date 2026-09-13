"use client";

import { useState, type ReactNode } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  schemaSponsorContributo,
  schemaIncassoSponsor,
  TIPI_SPONSOR,
  ETICHETTE_TIPI_SPONSOR,
  type DatiSponsorContributo,
  type DatiIncassoSponsor,
} from "@/lib/validazioni/evento";
import { creaSponsorContributo, incassaSponsor } from "@/lib/sponsor/actions";

type PersonaOpzione = { id: string; nome: string; cognome: string };
type ContoOpzione = { id: string; nome: string };

export function DialogNuovoSponsor({
  persone,
  eventoId,
  raccoltaFondiId,
  trigger,
}: {
  persone: PersonaOpzione[];
  eventoId?: string;
  raccoltaFondiId?: string;
  trigger: ReactNode;
}) {
  const router = useRouter();
  const [aperto, setAperto] = useState(false);
  const { handleSubmit, control, register, formState: { errors, isSubmitting } } = useForm<DatiSponsorContributo>({
    resolver: zodResolver(schemaSponsorContributo),
    defaultValues: {
      soggettoId: "",
      soggettoLibero: "",
      tipo: "sponsorizzazione",
      importo: "",
      data: new Date().toISOString().slice(0, 10),
      eventoId: eventoId ?? "",
      raccoltaFondiId: raccoltaFondiId ?? "",
    },
  });

  async function onSubmit(dati: DatiSponsorContributo) {
    const esito = await creaSponsorContributo(dati);
    if ("errore" in esito) {
      toast.error(esito.errore);
      return;
    }
    toast.success("Sponsor/contributo registrato.");
    setAperto(false);
    router.refresh();
  }

  return (
    <Dialog open={aperto} onOpenChange={setAperto}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nuovo sponsor o contributo</DialogTitle>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="space-y-2">
            <Label htmlFor="soggettoId">Persona censita (facoltativo)</Label>
            <Controller
              control={control}
              name="soggettoId"
              render={({ field }) => (
                <Select value={field.value || undefined} onValueChange={field.onChange}>
                  <SelectTrigger id="soggettoId" className="w-full">
                    <SelectValue placeholder="Nessuna" />
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
            <Label htmlFor="soggettoLibero">Ragione sociale (se non censito)</Label>
            <Input id="soggettoLibero" {...register("soggettoLibero")} />
            {errors.soggettoLibero && <p className="text-sm text-destructive">{errors.soggettoLibero.message}</p>}
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
                    {TIPI_SPONSOR.map((t) => (
                      <SelectItem key={t} value={t}>
                        {ETICHETTE_TIPI_SPONSOR[t]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="importo">Importo (€)</Label>
              <Input id="importo" type="number" min="0" step="0.01" {...register("importo")} />
              {errors.importo && <p className="text-sm text-destructive">{errors.importo.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="data">Data</Label>
              <Input id="data" type="date" {...register("data")} />
            </div>
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

export function DialogIncassaSponsor({
  sponsorId,
  conti,
  onChiudi,
}: {
  sponsorId: string | null;
  conti: ContoOpzione[];
  onChiudi: () => void;
}) {
  const router = useRouter();
  const { handleSubmit, control, formState: { isSubmitting } } = useForm<DatiIncassoSponsor>({
    resolver: zodResolver(schemaIncassoSponsor),
    defaultValues: { contoId: conti[0]?.id ?? "" },
  });

  async function onSubmit(dati: DatiIncassoSponsor) {
    if (!sponsorId) return;
    const esito = await incassaSponsor(sponsorId, dati);
    if ("errore" in esito) {
      toast.error(esito.errore);
      return;
    }
    toast.success("Incasso registrato in prima nota.");
    onChiudi();
    router.refresh();
  }

  return (
    <Dialog open={sponsorId !== null} onOpenChange={(aperto) => !aperto && onChiudi()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Incassa il contributo</DialogTitle>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="space-y-2">
            <Label htmlFor="contoIncassoSponsor">Conto di destinazione</Label>
            <Controller
              control={control}
              name="contoId"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="contoIncassoSponsor" className="w-full">
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
            <Button type="submit" disabled={isSubmitting || conti.length === 0}>
              {isSubmitting && <Loader2 className="animate-spin" />}
              Conferma incasso
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
