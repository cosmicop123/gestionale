import "server-only";
import { prisma } from "@/lib/prisma";
import { RUOLI_CARICA_SOCIALE } from "@/lib/validazioni/carica-sociale";

export type TitolareCaricaSociale = {
  id: string;
  ruolo: string;
  persona: { id: string; nome: string; cognome: string };
  dataInizioMandato: Date;
};

/**
 * Titolari attualmente in carica (dataFineMandato non impostata, non
 * cancellati), ordinati secondo l'ordine convenzionale di un verbale
 * (Presidente, Vicepresidente, Segretario, Tesoriere, Consiglieri). Usata
 * sia dalla schermata di gestione in Amministrazione sia da ogni documento
 * che deve riportare in calce la composizione del Consiglio Direttivo
 * (verbale di ammissione neo-soci, Compilatore comunicazioni).
 */
export async function elencoConsiglioDirettivoAttuale(): Promise<TitolareCaricaSociale[]> {
  const righe = await prisma.caricaSociale.findMany({
    where: { dataFineMandato: null, deletedAt: null },
    include: { persona: { select: { id: true, nome: true, cognome: true } } },
    orderBy: { dataInizioMandato: "asc" },
  });

  const indiceRuolo = (ruolo: string) => RUOLI_CARICA_SOCIALE.indexOf(ruolo as (typeof RUOLI_CARICA_SOCIALE)[number]);
  return righe.sort((a, b) => indiceRuolo(a.ruolo) - indiceRuolo(b.ruolo));
}
