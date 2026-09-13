import { richiediRuolo } from "@/lib/auth/richiedi-utente";
import { Card, CardContent } from "@/components/ui/card";
import { PersonaForm } from "@/components/persona/persona-form";

export default async function NuovaPersonaPage() {
  await richiediRuolo(["amministratore", "segreteria"]);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Nuova persona</h1>
        <p className="text-sm text-muted-foreground">
          Crea l&apos;anagrafica: potrai avviare una domanda di ammissione a socio subito dopo.
        </p>
      </div>
      <Card>
        <CardContent className="pt-6">
          <PersonaForm />
        </CardContent>
      </Card>
    </div>
  );
}
