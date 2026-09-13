/**
 * I contenuti inseriti nel sito generato (denominazione, presentazione,
 * titoli e descrizioni dei corsi) vengono dal database, non da un template
 * fidato: vanno sempre escapati prima di finire in markup HTML letterale,
 * altrimenti un carattere come "&" o "<" in un titolo di corso genera un
 * sito rotto (o, nel peggiore dei casi, markup non voluto).
 */
export function escapeHtml(testo: string): string {
  return testo
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Converte gli a-capo di un testo libero (es. la presentazione) in <br>, dopo l'escape. */
export function escapeHtmlConACapo(testo: string): string {
  return escapeHtml(testo).replace(/\r?\n/g, "<br>");
}
