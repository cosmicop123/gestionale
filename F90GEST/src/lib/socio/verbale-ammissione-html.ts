import { escapeHtml } from "@/lib/sito-pubblico/escape-html";

export type NeoIscrittoVerbale = {
  cognome: string;
  nome: string;
  codiceFiscale: string | null;
  categoriaProposta: string;
  dataDomanda: string; // già formattata it-IT (gg/mm/aaaa)
};

export type TitolareVerbale = { ruolo: string; nome: string; cognome: string };

/**
 * Bozza HTML di partenza per il verbale "proposta di ammissione neo-soci",
 * precompilata con l'elenco delle domande in attesa e la firma del
 * Consiglio Direttivo in calce — poi apre nello stesso editor del
 * Compilatore (§ nota fuori milestone), quindi il testo resta modificabile
 * prima di esportarlo o salvarlo. Funzione pura (nessun accesso al DB) per
 * poterla testare senza un database: i dati vengono già risolti dal
 * chiamante (la pagina server).
 */
export function costruisciBozzaVerbaleAmmissione(dati: {
  neoIscritti: NeoIscrittoVerbale[];
  consiglioDirettivo: TitolareVerbale[];
}): string {
  const righeElenco =
    dati.neoIscritti.length === 0
      ? "<li>Nessuna domanda di ammissione in attesa di valutazione.</li>"
      : dati.neoIscritti
          .map((p) => {
            const cf = p.codiceFiscale ? ` — C.F. ${escapeHtml(p.codiceFiscale)}` : "";
            return `<li>${escapeHtml(p.cognome)} ${escapeHtml(p.nome)}${cf} — categoria proposta: ${escapeHtml(
              p.categoriaProposta
            )} — domanda del ${escapeHtml(p.dataDomanda)}</li>`;
          })
          .join("");

  const righeFirme =
    dati.consiglioDirettivo.length === 0
      ? "<p>Composizione del Consiglio Direttivo non impostata (Amministrazione → Consiglio direttivo).</p>"
      : dati.consiglioDirettivo
          .map((t) => `<p>${escapeHtml(t.ruolo)}: ${escapeHtml(t.cognome)} ${escapeHtml(t.nome)} — Firma: _______________________</p>`)
          .join("");

  return (
    "<h2>Proposta di ammissione nuovi soci</h2>" +
    "<p>Si propone al Consiglio Direttivo dell'associazione l'ammissione dei seguenti richiedenti, che hanno presentato domanda di adesione:</p>" +
    `<ul>${righeElenco}</ul>` +
    "<p>Il Consiglio Direttivo, esaminate le domande sopra elencate, delibera quanto segue: _______________________________________________</p>" +
    "<p>Letto, approvato e sottoscritto.</p>" +
    "<h3>Il Consiglio Direttivo</h3>" +
    righeFirme
  );
}
