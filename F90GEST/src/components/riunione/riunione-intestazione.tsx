"use client";

import { useRouter } from "next/navigation";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ETICHETTE_TIPI_RIUNIONE } from "@/lib/validazioni/riunione";
import { impostaQuorum } from "@/lib/riunione/actions";

type RiunioneBase = {
  id: string;
  tipo: string;
  numeroProgressivo: number;
  data: Date;
  ora: string | null;
  sede: string | null;
  quorumCostitutivoVerificato: boolean | null;
  quorumDeliberativoVerificato: boolean | null;
};

export function RiunioneIntestazione({ riunione, puoGestire }: { riunione: RiunioneBase; puoGestire: boolean }) {
  const router = useRouter();

  async function onCambiaQuorum(campo: "quorumCostitutivoVerificato" | "quorumDeliberativoVerificato", valore: boolean) {
    const esito = await impostaQuorum(riunione.id, { [campo]: valore });
    if ("errore" in esito) {
      toast.error(esito.errore);
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {ETICHETTE_TIPI_RIUNIONE[riunione.tipo as keyof typeof ETICHETTE_TIPI_RIUNIONE] ?? riunione.tipo} n.{" "}
          {riunione.numeroProgressivo}
        </h1>
        <p className="text-sm text-muted-foreground">
          {new Intl.DateTimeFormat("it-IT").format(riunione.data)}
          {riunione.ora ? `, ore ${riunione.ora}` : ""}
          {riunione.sede ? ` — ${riunione.sede}` : ""}
        </p>
      </div>
      <div className="flex flex-col items-end gap-2">
        <Button variant="outline" size="sm" asChild>
          <a href={`/libri-sociali/riunioni/${riunione.id}/verbale/pdf`} target="_blank" rel="noopener noreferrer">
            <Download /> Verbale PDF
          </a>
        </Button>
        {puoGestire && (
          <div className="flex flex-col gap-1 text-sm">
            <label className="flex items-center gap-2">
              <Checkbox
                checked={riunione.quorumCostitutivoVerificato ?? false}
                onCheckedChange={(v) => onCambiaQuorum("quorumCostitutivoVerificato", v === true)}
              />
              Quorum costitutivo verificato
            </label>
            <label className="flex items-center gap-2">
              <Checkbox
                checked={riunione.quorumDeliberativoVerificato ?? false}
                onCheckedChange={(v) => onCambiaQuorum("quorumDeliberativoVerificato", v === true)}
              />
              Quorum deliberativo verificato
            </label>
          </div>
        )}
      </div>
    </div>
  );
}
