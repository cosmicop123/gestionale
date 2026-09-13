import { EventoForm } from "./evento-form";

type EventoDettagli = {
  id: string;
  titolo: string;
  tipologia: string;
  dataInizio: Date;
  dataFine: Date | null;
  luogo: string | null;
  descrizione: string | null;
  tipoIngresso: string;
  capienza: number | null;
};

export function TabDettagliEvento({ evento, puoGestire }: { evento: EventoDettagli; puoGestire: boolean }) {
  if (!puoGestire) {
    return (
      <div className="space-y-2 rounded-md border p-4 text-sm">
        <p>{evento.descrizione ?? "Nessuna descrizione."}</p>
      </div>
    );
  }
  return <EventoForm evento={evento} />;
}
