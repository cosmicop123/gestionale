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
import { STATI_EVENTO, ETICHETTE_STATI_EVENTO, ETICHETTE_TIPOLOGIE_EVENTO } from "@/lib/validazioni/evento";
import { cambiaStatoEvento } from "@/lib/evento/actions";

const VARIANTE_STATO: Record<string, "success" | "warning" | "secondary" | "outline" | "destructive"> = {
  bozza: "secondary",
  programmato: "success",
  in_corso: "warning",
  concluso: "outline",
  annullato: "destructive",
};

type EventoBase = {
  id: string;
  titolo: string;
  tipologia: string;
  luogo: string | null;
  stato: string;
  dataInizio: Date;
};

export function EventoIntestazione({ evento, puoGestire }: { evento: EventoBase; puoGestire: boolean }) {
  const router = useRouter();

  async function onCambiaStato(stato: string) {
    const esito = await cambiaStatoEvento(evento.id, { stato: stato as (typeof STATI_EVENTO)[number] });
    if ("errore" in esito) {
      toast.error(esito.errore);
      return;
    }
    toast.success("Stato dell'evento aggiornato.");
    router.refresh();
  }

  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{evento.titolo}</h1>
        <p className="text-sm text-muted-foreground">
          {ETICHETTE_TIPOLOGIE_EVENTO[evento.tipologia as keyof typeof ETICHETTE_TIPOLOGIE_EVENTO] ?? evento.tipologia}
          {evento.luogo ? ` · ${evento.luogo}` : ""} · {new Intl.DateTimeFormat("it-IT").format(evento.dataInizio)}
        </p>
      </div>
      {puoGestire ? (
        <Select value={evento.stato} onValueChange={onCambiaStato}>
          <SelectTrigger className="w-56">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATI_EVENTO.map((stato) => (
              <SelectItem key={stato} value={stato}>
                {ETICHETTE_STATI_EVENTO[stato]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <Badge variant={VARIANTE_STATO[evento.stato] ?? "outline"}>
          {ETICHETTE_STATI_EVENTO[evento.stato as keyof typeof ETICHETTE_STATI_EVENTO] ?? evento.stato}
        </Badge>
      )}
    </div>
  );
}
