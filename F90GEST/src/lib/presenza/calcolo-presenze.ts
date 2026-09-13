/**
 * Calcolo ore frequentate e percentuale di presenza (§6 M4): conta come
 * "frequentata" una lezione dove lo stato è "presente" o "ritardo" (la
 * persona era comunque fisicamente presente); "assente" e "giustificato"
 * NON concorrono alle ore frequentate, anche se giustificato non pesa
 * negativamente altrove — resta comunque un'assenza ai fini del monte ore.
 * Il denominatore è la somma delle ore delle sole lezioni già "svolte":
 * una lezione rinviata o annullata non deve penalizzare la percentuale.
 */
export type LezioneConPresenza = {
  durataOre: number;
  statoLezione: string;
  statoPresenza: string | null;
};

export type EsitoCalcoloPresenze = {
  oreFrequentate: number;
  oreTotaliSvolte: number;
  percentualePresenza: number;
};

const STATI_PRESENZA_CONTEGGIATI = ["presente", "ritardo"];

export function calcolaPresenze(lezioni: LezioneConPresenza[]): EsitoCalcoloPresenze {
  const lezioniSvolte = lezioni.filter((l) => l.statoLezione === "svolta");

  const oreTotaliSvolte = lezioniSvolte.reduce((somma, l) => somma + l.durataOre, 0);
  const oreFrequentate = lezioniSvolte
    .filter((l) => l.statoPresenza && STATI_PRESENZA_CONTEGGIATI.includes(l.statoPresenza))
    .reduce((somma, l) => somma + l.durataOre, 0);

  const percentualePresenza = oreTotaliSvolte > 0 ? (oreFrequentate / oreTotaliSvolte) * 100 : 0;

  return { oreFrequentate, oreTotaliSvolte, percentualePresenza };
}

export function haDirittoAttestato(percentualePresenza: number, sogliaMinima: number): boolean {
  return percentualePresenza >= sogliaMinima;
}
