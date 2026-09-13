import { richiediRuolo } from "@/lib/auth/richiedi-utente";
import { prisma } from "@/lib/prisma";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TabEnte } from "./tab-ente";
import { TabAnniSociali } from "./tab-anni-sociali";
import { TabUtenti } from "./tab-utenti";
import { TabInformativa } from "./tab-informativa";
import type { DatiEnte } from "@/lib/validazioni/ente";

export default async function AmministrazionePage() {
  const utenteCorrente = await richiediRuolo(["amministratore"]);

  const [associazione, anniSociali, utenti, informativaCorrente] = await Promise.all([
    prisma.associazione.findFirst(),
    prisma.annoSociale.findMany({ orderBy: { dataInizio: "desc" } }),
    prisma.utente.findMany({ where: { deletedAt: null }, orderBy: { email: "asc" } }),
    prisma.informativa.findFirst({ orderBy: { dataPubblicazione: "desc" } }),
  ]);

  if (!associazione) {
    return <p className="text-sm text-destructive">Anagrafica ente non trovata.</p>;
  }

  const valoriIniziali: DatiEnte = {
    denominazione: associazione.denominazione,
    codiceFiscale: associazione.codiceFiscale,
    partitaIva: associazione.partitaIva ?? "",
    sedeLegaleVia: associazione.sedeLegaleVia,
    sedeLegaleCap: associazione.sedeLegaleCap,
    sedeLegaleComune: associazione.sedeLegaleComune,
    sedeLegaleProvincia: associazione.sedeLegaleProvincia,
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
    regimeFiscale: associazione.regimeFiscale ?? "",
    piePaginaRicevute: associazione.piePaginaRicevute ?? "",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Amministrazione</h1>
        <p className="text-sm text-muted-foreground">
          Dati dell&apos;associazione, anni sociali e utenti del gestionale.
        </p>
      </div>

      <Tabs defaultValue="ente">
        <TabsList>
          <TabsTrigger value="ente">Dati ente</TabsTrigger>
          <TabsTrigger value="anni-sociali">Anni sociali</TabsTrigger>
          <TabsTrigger value="utenti">Utenti</TabsTrigger>
          <TabsTrigger value="informativa">Informativa privacy</TabsTrigger>
        </TabsList>
        <TabsContent value="ente" className="max-w-2xl">
          <TabEnte valoriIniziali={valoriIniziali} />
        </TabsContent>
        <TabsContent value="anni-sociali">
          <TabAnniSociali anniSociali={anniSociali} />
        </TabsContent>
        <TabsContent value="utenti">
          <TabUtenti utenti={utenti} emailUtenteCorrente={utenteCorrente.email} />
        </TabsContent>
        <TabsContent value="informativa">
          <TabInformativa informativaCorrente={informativaCorrente} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
