import { redirect } from "next/navigation";
import { richiediRuolo } from "@/lib/auth/richiedi-utente";
import { prisma } from "@/lib/prisma";
import { OnboardingClient } from "./onboarding-client";
import type { DatiEnte } from "@/lib/validazioni/ente";

export default async function OnboardingPage() {
  await richiediRuolo(["amministratore"]);

  const associazione = await prisma.associazione.findFirst();
  if (!associazione) {
    redirect("/dashboard");
  }
  if (associazione.configurazioneCompletata) {
    redirect("/dashboard");
  }

  const valoriIniziali: DatiEnte = {
    denominazione: associazione.denominazione === "Nuova Associazione" ? "" : associazione.denominazione,
    codiceFiscale: associazione.codiceFiscale === "00000000000" ? "" : associazione.codiceFiscale,
    partitaIva: associazione.partitaIva ?? "",
    sedeLegaleVia: associazione.sedeLegaleVia === "Via da definire, 1" ? "" : associazione.sedeLegaleVia,
    sedeLegaleCap: associazione.sedeLegaleCap === "00000" ? "" : associazione.sedeLegaleCap,
    sedeLegaleComune: associazione.sedeLegaleComune === "Da definire" ? "" : associazione.sedeLegaleComune,
    sedeLegaleProvincia: associazione.sedeLegaleProvincia === "XX" ? "" : associazione.sedeLegaleProvincia,
    sedeOperativaVia: associazione.sedeOperativaVia ?? "",
    sedeOperativaCap: associazione.sedeOperativaCap ?? "",
    sedeOperativaComune: associazione.sedeOperativaComune ?? "",
    sedeOperativaProvincia: associazione.sedeOperativaProvincia ?? "",
    pec: associazione.pec ?? "",
    email: associazione.email ?? "",
    telefono: associazione.telefono ?? "",
    iban: associazione.iban ?? "",
    dataCostituzione: associazione.dataCostituzione
      ? associazione.dataCostituzione.toISOString().slice(0, 10)
      : "",
    statutoRiferimento: associazione.statutoRiferimento ?? "",
    iscrittoRunts: associazione.iscrittoRunts,
    numeroRunts: associazione.numeroRunts ?? "",
    regimeFiscale:
      associazione.regimeFiscale === "Da definire — verificare con il proprio consulente fiscale"
        ? ""
        : (associazione.regimeFiscale ?? ""),
    piePaginaRicevute: associazione.piePaginaRicevute ?? "",
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:py-16">
      <div className="mb-8 space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Benvenuto in F90GEST</h1>
        <p className="text-sm text-muted-foreground">
          Prima di iniziare, personalizza i dati della tua associazione. Potrai modificarli in
          qualsiasi momento da Amministrazione → Dati ente.
        </p>
      </div>
      <OnboardingClient valoriIniziali={valoriIniziali} />
    </div>
  );
}
