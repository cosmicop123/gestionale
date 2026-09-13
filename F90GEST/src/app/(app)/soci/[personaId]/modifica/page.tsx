import { notFound } from "next/navigation";
import { richiediRuolo } from "@/lib/auth/richiedi-utente";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { PersonaForm } from "@/components/persona/persona-form";
import type { DatiPersona } from "@/lib/validazioni/persona";

export default async function ModificaPersonaPage({
  params,
}: {
  params: Promise<{ personaId: string }>;
}) {
  await richiediRuolo(["amministratore", "segreteria"]);
  const { personaId } = await params;

  const persona = await prisma.persona.findUnique({
    where: { id: personaId, deletedAt: null },
    include: { relazioniComeMinore: { where: { deletedAt: null } } },
  });
  if (!persona) notFound();

  const guardian = persona.relazioniComeMinore[0];

  const valoriIniziali: Partial<DatiPersona> = {
    nome: persona.nome,
    cognome: persona.cognome,
    codiceFiscale: persona.codiceFiscale ?? "",
    dataNascita: persona.dataNascita ? persona.dataNascita.toISOString().slice(0, 10) : "",
    comuneNascita: persona.comuneNascita ?? "",
    provinciaNascita: persona.provinciaNascita ?? "",
    sesso: (persona.sesso as "M" | "F" | undefined) ?? undefined,
    residenzaVia: persona.residenzaVia ?? "",
    residenzaCap: persona.residenzaCap ?? "",
    residenzaComune: persona.residenzaComune ?? "",
    residenzaProvincia: persona.residenzaProvincia ?? "",
    email: persona.email ?? "",
    telefono: persona.telefono ?? "",
    note: persona.note ?? "",
    genitore: guardian
      ? {
          genitoreNomeCognome: guardian.genitoreNomeCognome ?? "",
          genitoreCodiceFiscale: guardian.genitoreCodiceFiscale ?? "",
          genitoreEmail: guardian.genitoreEmail ?? "",
          genitoreTelefono: guardian.genitoreTelefono ?? "",
          gradoParentela: guardian.gradoParentela as "genitore" | "tutore" | "altro_esercente",
        }
      : undefined,
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Modifica {persona.cognome} {persona.nome}
        </h1>
      </div>
      <Card>
        <CardContent className="pt-6">
          <PersonaForm personaId={persona.id} valoriIniziali={valoriIniziali} />
        </CardContent>
      </Card>
    </div>
  );
}
