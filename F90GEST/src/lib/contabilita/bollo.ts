/**
 * Calcolo dell'imposta di bollo sulle ricevute (§7.4): 2,00 € (parametro)
 * oltre i 77,47 € (parametro) di importo, **solo** per le nature fiscali
 * che l'ente ha configurato come soggette (parametro
 * `contabilita.nature_fiscali_soggette_a_bollo`). Il software non decide
 * quali nature fiscali richiedano il bollo: espone un parametro invece di
 * "inventare" una regola fiscale (§12) — la scelta iniziale proposta va
 * verificata con il proprio consulente fiscale.
 */
export function calcolaBollo(parametri: {
  importo: number;
  naturaFiscale: string;
  sogliaBolloEuro: number;
  importoBolloEuro: number;
  natureFiscaliSoggetteABollo: string[];
}): { applicato: boolean; importo: number | null } {
  const soggetta = parametri.natureFiscaliSoggetteABollo.includes(parametri.naturaFiscale);
  const oltreSoglia = parametri.importo > parametri.sogliaBolloEuro;

  if (soggetta && oltreSoglia) {
    return { applicato: true, importo: parametri.importoBolloEuro };
  }
  return { applicato: false, importo: null };
}
