import { richiediRuolo } from "@/lib/auth/richiedi-utente";
import { EventoForm } from "@/components/evento/evento-form";

export default async function NuovoEventoPage() {
  await richiediRuolo(["amministratore", "segreteria"]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Nuovo evento</h1>
      </div>
      <EventoForm />
    </div>
  );
}
