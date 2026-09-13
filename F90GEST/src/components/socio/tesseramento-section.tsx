"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Loader2, Download, CreditCard } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
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
import { schemaEmissioneTessera, type DatiEmissioneTessera } from "@/lib/validazioni/tesseramento";
import { emettiTessera } from "@/lib/tesseramento/actions";

type AnnoSocialeOpzione = { id: string; etichetta: string };
type Tesseramento = { id: string; numeroTessera: string; annoSociale: { etichetta: string }; dataEmissione: Date | null };

export function TesseramentoSection({
  socioId,
  anniSocialiDisponibili,
  tesseramenti,
}: {
  socioId: string;
  anniSocialiDisponibili: AnnoSocialeOpzione[];
  tesseramenti: Tesseramento[];
}) {
  const router = useRouter();
  const [aperto, setAperto] = useState(false);
  const { handleSubmit, control, formState: { isSubmitting } } = useForm<DatiEmissioneTessera>({
    resolver: zodResolver(schemaEmissioneTessera),
    defaultValues: { socioId, annoSocialeId: anniSocialiDisponibili[0]?.id ?? "" },
  });

  async function onSubmit(dati: DatiEmissioneTessera) {
    const esito = await emettiTessera(dati);
    if ("errore" in esito) {
      toast.error(esito.errore);
      return;
    }
    toast.success("Tessera emessa.");
    setAperto(false);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Numero tessera</TableHead>
            <TableHead>Anno sociale</TableHead>
            <TableHead>Data emissione</TableHead>
            <TableHead className="text-right">Tessera</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tesseramenti.length === 0 && (
            <TableRow>
              <TableCell colSpan={4} className="text-center text-muted-foreground">
                Nessun tesseramento emesso.
              </TableCell>
            </TableRow>
          )}
          {tesseramenti.map((t) => (
            <TableRow key={t.id}>
              <TableCell className="font-medium">{t.numeroTessera}</TableCell>
              <TableCell>{t.annoSociale.etichetta}</TableCell>
              <TableCell>
                {t.dataEmissione ? new Intl.DateTimeFormat("it-IT").format(t.dataEmissione) : "—"}
              </TableCell>
              <TableCell className="text-right">
                <Button variant="outline" size="sm" asChild>
                  <a href={`/soci/tessere/${t.id}/pdf`} target="_blank" rel="noopener noreferrer">
                    <Download /> PDF
                  </a>
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={aperto} onOpenChange={setAperto}>
        <DialogTrigger asChild>
          <Button variant="outline" disabled={anniSocialiDisponibili.length === 0}>
            <CreditCard /> Emetti tessera
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Emetti tessera</DialogTitle>
            <DialogDescription>Genera un numero tessera con QR per l&apos;anno sociale scelto.</DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="space-y-2">
              <Label htmlFor="annoSocialeId">Anno sociale</Label>
              <Controller
                control={control}
                name="annoSocialeId"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="annoSocialeId" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {anniSocialiDisponibili.map((anno) => (
                        <SelectItem key={anno.id} value={anno.id}>
                          {anno.etichetta}
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
                Emetti
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
