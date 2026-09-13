/**
 * Sostituisce le variabili `{{nome}}` in un template con i valori risolti per
 * il singolo destinatario (§9). Variabili non presenti nella mappa vengono
 * sostituite con una stringa vuota, mai lasciate come placeholder letterale
 * nell'email inviata.
 */
export function sostituisciVariabili(testo: string, variabili: Record<string, string>): string {
  return testo.replace(/\{\{\s*(\w+)\s*\}\}/g, (_corrispondenza, chiave: string) => variabili[chiave] ?? "");
}
