import type { DatiSitoPubblico } from "../dati";
import { escapeHtml, escapeHtmlConACapo } from "../escape-html";
import { formattaPeriodoCorso, formattaData } from "../formattazione";

export function generaHtmlClassico(dati: DatiSitoPubblico): string {
  const corsi = dati.corsi
    .map(
      (c) => `
      <article class="corso">
        <h3>${escapeHtml(c.titolo)}</h3>
        <p class="meta">${escapeHtml(formattaPeriodoCorso(c.dataInizio, c.dataFine))}${c.sede ? ` &middot; ${escapeHtml(c.sede)}` : ""}${c.quotaPartecipazione ? ` &middot; quota € ${escapeHtml(c.quotaPartecipazione)}` : ""}</p>
        ${c.descrizione ? `<p>${escapeHtmlConACapo(c.descrizione)}</p>` : ""}
        ${c.linkIscrizione ? `<a class="bottone" href="${escapeHtml(c.linkIscrizione)}">Iscriviti</a>` : ""}
      </article>`
    )
    .join("\n");

  return `<!doctype html>
<html lang="it">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(dati.denominazione)}</title>
<style>
  :root { color-scheme: light; }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    font-family: Georgia, "Times New Roman", serif;
    background: #f7f3ea;
    color: #1c2b3a;
    line-height: 1.6;
  }
  header {
    background: #1c2b3a;
    color: #f7f3ea;
    padding: 3rem 1.5rem;
    text-align: center;
  }
  header h1 { margin: 0 0 .5rem; font-size: 2.2rem; font-weight: normal; letter-spacing: .03em; }
  header p { margin: 0; opacity: .85; }
  main { max-width: 780px; margin: 0 auto; padding: 2.5rem 1.5rem; }
  section { margin-bottom: 2.5rem; }
  h2 {
    font-size: 1.4rem;
    border-bottom: 2px solid #1c2b3a;
    padding-bottom: .4rem;
    margin-bottom: 1.2rem;
  }
  .corso {
    background: #fff;
    border: 1px solid #ddd3bd;
    padding: 1.2rem 1.4rem;
    margin-bottom: 1rem;
  }
  .corso h3 { margin: 0 0 .3rem; }
  .corso .meta { margin: 0 0 .6rem; color: #5a5142; font-size: .9rem; }
  .bottone {
    display: inline-block;
    margin-top: .6rem;
    padding: .5rem 1.1rem;
    background: #1c2b3a;
    color: #f7f3ea;
    text-decoration: none;
    font-family: Georgia, serif;
  }
  .bottone:hover { background: #33465c; }
  .contatti p { margin: .2rem 0; }
  footer {
    text-align: center;
    padding: 1.5rem;
    color: #7a7262;
    font-size: .8rem;
  }
</style>
</head>
<body>
  <header>
    <h1>${escapeHtml(dati.denominazione)}</h1>
    <p>${escapeHtml(dati.indirizzo)}</p>
  </header>
  <main>
    ${dati.presentazione ? `<section><h2>Chi siamo</h2><p>${escapeHtmlConACapo(dati.presentazione)}</p></section>` : ""}
    <section>
      <h2>Corsi disponibili</h2>
      ${corsi || "<p>Nessun corso attualmente aperto alle iscrizioni.</p>"}
    </section>
    <section class="contatti">
      <h2>Contatti</h2>
      <p>${escapeHtml(dati.indirizzo)}</p>
      ${dati.email ? `<p>Email: <a href="mailto:${escapeHtml(dati.email)}">${escapeHtml(dati.email)}</a></p>` : ""}
      ${dati.telefono ? `<p>Telefono: ${escapeHtml(dati.telefono)}</p>` : ""}
      ${dati.pec ? `<p>PEC: ${escapeHtml(dati.pec)}</p>` : ""}
    </section>
  </main>
  <footer>Pagina generata il ${escapeHtml(formattaData(dati.generatoIl))}</footer>
</body>
</html>
`;
}
