"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { STATI_CORSO, ETICHETTE_STATI_CORSO } from "@/lib/validazioni/corso";
import { cambiaStatoCorso } from "@/lib/corso/actions";

const VARIANTE_STATO: Record<string, "success" | "warning" | "secondary" | "outline" | "destructive"> = {
  bozza: "secondary",
  aperto_iscrizioni: "success",
  in_corso: "warning",
  concluso: "outline",
  annullato: "destructive",
};

type CorsoBase = {
  id: string;
  titolo: string;
  edizione: string | null;
  sede: string | null;
  stato: string;
  dataInizio: Date;
};

export function CorsoIntestazione({ corso, puoGestire }: { corso: CorsoBase; puoGestire: boolean }) {
  const router = useRouter();

  async function onCambiaStato(stato: string) {
    const esito = await cambiaStatoCorso(corso.id, { stato: stato as (typeof STATI_CORSO)[number] });
    if ("errore" in esito) {
      toast.error(esito.errore);
      return;
    }
    toast.success("Stato del corso aggiornato.");
    router.refresh();
  }

  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {corso.titolo}
          {corso.edizione ? ` — ${corso.edizione}` : ""}
        </h1>
        <p className="text-sm text-muted-foreground">
          {corso.sede ? `${corso.sede} · ` : ""}
          Inizio {new Intl.DateTimeFormat("it-IT").format(corso.dataInizio)}
        </p>
      </div>
      {puoGestire ? (
        <Select value={corso.stato} onValueChange={onCambiaStato}>
          <SelectTrigger className="w-56">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATI_CORSO.map((stato) => (
              <SelectItem key={stato} value={stato}>
                {ETICHETTE_STATI_CORSO[stato]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <Badge variant={VARIANTE_STATO[corso.stato] ?? "outline"}>
          {ETICHETTE_STATI_CORSO[corso.stato as keyof typeof ETICHETTE_STATI_CORSO] ?? corso.stato}
        </Badge>
      )}
    </div>
  );
}
