/**
 * Segnaposto riconosciuti nel testo di un modello, stessa sintassi
 * `{{variabile}}` già usata per i template delle comunicazioni email (M9,
 * `src/lib/email/template.ts`): un unico formato in tutta l'app invece di
 * inventarne uno nuovo per i documenti.
 */
export function estraiVariabili(corpoTesto: string): string[] {
  const trovate: string[] = [];
  const visti = new Set<string>();
  for (const match of corpoTesto.matchAll(/\{\{\s*(\w+)\s*\}\}/g)) {
    const nome = match[1];
    if (!visti.has(nome)) {
      visti.add(nome);
      trovate.push(nome);
    }
  }
  return trovate;
}
