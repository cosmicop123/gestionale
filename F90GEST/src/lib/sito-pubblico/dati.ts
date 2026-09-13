import "server-only";
import { prisma } from "@/lib/prisma";
import { ottieniParametriSitoPubblico } from "./parametri";

export type CorsoSitoPubblico = {
  titolo: string;
  descrizione: string | null;
  sede: string | null;
  dataInizio: Date;
  dataFine: Date | null;
  quotaPartecipazione: string | null;
  linkIscrizione: string | null;
};

export type DatiSitoPubblico = {
  denominazione: string;
  indirizzo: string;
  email: string | null;
  telefono: string | null;
  pec: string | null;
  presentazione: string;
  corsi: CorsoSitoPubblico[];
  generatoIl: Date;
};

// Corsi mostrati sul sito pubblico: solo quelli aperti alle iscrizioni o già
// avviati, mai bozze (non ancora decise) né corsi annullati o conclusi.
const STATI_CORSO_VETRINA = ["aperto_iscrizioni", "in_corso"];

export async function costruisciDatiSitoPubblico(): Promise<DatiSitoPubblico> {
  const [associazione, parametri, corsi] = await Promise.all([
    prisma.associazione.findFirst(),
    ottieniParametriSitoPubblico(),
    prisma.corso.findMany({
      where: { deletedAt: null, stato: { in: STATI_CORSO_VETRINA } },
      orderBy: { dataInizio: "asc" },
    }),
  ]);

  if (!associazione) {
    throw new Error("Anagrafica ente non trovata: completare prima la configurazione da Amministrazione.");
  }

  const indirizzoOperativo =
    associazione.sedeOperativaVia && associazione.sedeOperativaComune
      ? `${associazione.sedeOperativaVia}, ${associazione.sedeOperativaCap ?? ""} ${associazione.sedeOperativaComune} (${associazione.sedeOperativaProvincia ?? ""})`
      : null;
  const indirizzoLegale = `${associazione.sedeLegaleVia}, ${associazione.sedeLegaleCap} ${associazione.sedeLegaleComune} (${associazione.sedeLegaleProvincia})`;

  const urlBase = parametri.urlBase.replace(/\/+$/, "");

  return {
    denominazione: associazione.denominazione,
    indirizzo: indirizzoOperativo ?? indirizzoLegale,
    email: associazione.email,
    telefono: associazione.telefono,
    pec: associazione.pec,
    presentazione: parametri.presentazione,
    generatoIl: new Date(),
    corsi: corsi.map((c) => ({
      titolo: c.titolo,
      descrizione: c.descrizione,
      sede: c.sede,
      dataInizio: c.dataInizio,
      dataFine: c.dataFine,
      quotaPartecipazione: c.quotaPartecipazione ? Number(c.quotaPartecipazione).toFixed(2) : null,
      linkIscrizione: urlBase ? `${urlBase}/iscrizione/${c.id}` : null,
    })),
  };
}
