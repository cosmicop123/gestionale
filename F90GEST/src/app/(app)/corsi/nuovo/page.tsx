import { richiediRuolo } from "@/lib/auth/richiedi-utente";
import { CorsoNuovoForm } from "@/components/corso/corso-nuovo-form";

export default async function NuovoCorsoPage() {
  await richiediRuolo(["amministratore", "segreteria"]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Nuovo corso</h1>
        <p className="text-sm text-muted-foreground">
          Il calendario delle lezioni si può generare automaticamente dalla cadenza settimanale, oppure
          aggiungere manualmente in seguito dalla scheda del corso.
        </p>
      </div>
      <CorsoNuovoForm />
    </div>
  );
}
