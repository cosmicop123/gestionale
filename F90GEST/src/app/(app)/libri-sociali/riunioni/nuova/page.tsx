import { richiediRuolo } from "@/lib/auth/richiedi-utente";
import { RiunioneNuovoForm } from "@/components/riunione/riunione-nuovo-form";

export default async function NuovaRiunionePage() {
  await richiediRuolo(["amministratore", "segreteria"]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Nuova riunione</h1>
      <RiunioneNuovoForm />
    </div>
  );
}
