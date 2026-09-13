import { richiediRuolo } from "@/lib/auth/richiedi-utente";
import { ImportazioneSoci } from "@/components/persona/importazione-soci";

export default async function ImportaSociPage() {
  await richiediRuolo(["amministratore", "segreteria"]);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Importa soci da Excel</h1>
        <p className="text-sm text-muted-foreground">
          Per partire dai file già in uso in associazione: mappatura guidata delle colonne,
          validazione riga per riga e report degli scarti.
        </p>
      </div>
      <ImportazioneSoci />
    </div>
  );
}
