import type { DatiSitoPubblico } from "../dati";
import { escapeHtml, escapeHtmlConACapo } from "../escape-html";
import { formattaPeriodoCorso, formattaData } from "../formattazione";

export function generaHtmlModerno(dati: DatiSitoPubblico): string {
  const corsi = dati.corsi
    .map(
      (c) => `
      <article class="card">
        <h3>${escapeHtml(c.titolo)}</h3>
        <p class="meta">${escapeHtml(formattaPeriodoCorso(c.dataInizio, c.dataFine))}</p>
        ${c.sede ? `<p class="meta">📍 ${escapeHtml(c.sede)}</p>` : ""}
        ${c.quotaPartecipazione ? `<p class="quota">€ ${escapeHtml(c.quotaPartecipazione)}</p>` : `<p class="quota">Gratuito</p>`}
        ${c.descrizione ? `<p class="descrizione">${escapeHtmlConACapo(c.descrizione)}</p>` : ""}
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
    font-family: -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    background: #f5f8fb;
    color: #17263b;
    line-height: 1.55;
  }
  header {
    background: #1256cc;
    color: #fff;
    padding: 3.5rem 1.5rem 3rem;
    text-align: center;
  }
  header h1 { margin: 0 0 .5rem; font-size: 2.4rem; font-weight: 700; }
  header p { margin: 0; opacity: .9; }
  main { max-width: 960px; margin: -1.5rem auto 0; padding: 0 1.5rem 3rem; }
  section { margin-top: 2.5rem; }
  h2 { font-size: 1.5rem; font-weight: 700; margin-bottom: 1.2rem; }
  .intro-card {
    background: #fff;
    border-radius: 14px;
    box-shadow: 0 6px 20px rgba(23, 38, 59, .08);
    padding: 1.5rem 1.8rem;
  }
  .griglia {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: 1.2rem;
  }
  .card {
    background: #fff;
    border-radius: 14px;
    box-shadow: 0 6px 20px rgba(23, 38, 59, .08);
    padding: 1.4rem 1.5rem;
    display: flex;
    flex-direction: column;
  }
  .card h3 { margin: 0 0 .5rem; font-size: 1.15rem; }
  .card .meta { margin: 0 0 .2rem; color: #5b6b82; font-size: .88rem; }
  .card .quota { font-weight: 700; color: #1256cc; margin: .5rem 0; }
  .card .descrizione { font-size: .92rem; color: #33455e; flex-grow: 1; }
  .bottone {
    display: inline-block;
    margin-top: .8rem;
    padding: .55rem 1.2rem;
    background: #1256cc;
    color: #fff;
    text-decoration: none;
    border-radius: 999px;
    font-weight: 600;
    text-align: center;
  }
  .bottone:hover { background: #0d3f9c; }
  .contatti p { margin: .3rem 0; }
  footer {
    text-align: center;
    padding: 2rem 1.5rem;
    color: #7c8aa0;
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
    ${dati.presentazione ? `<section><div class="intro-card"><h2>Chi siamo</h2><p>${escapeHtmlConACapo(dati.presentazione)}</p></div></section>` : ""}
    <section>
      <h2>Corsi disponibili</h2>
      <div class="griglia">
        ${corsi || "<p>Nessun corso attualmente aperto alle iscrizioni.</p>"}
      </div>
    </section>
    <section>
      <div class="intro-card contatti">
        <h2>Contatti</h2>
        <p>${escapeHtml(dati.indirizzo)}</p>
        ${dati.email ? `<p>Email: <a href="mailto:${escapeHtml(dati.email)}">${escapeHtml(dati.email)}</a></p>` : ""}
        ${dati.telefono ? `<p>Telefono: ${escapeHtml(dati.telefono)}</p>` : ""}
        ${dati.pec ? `<p>PEC: ${escapeHtml(dati.pec)}</p>` : ""}
      </div>
    </section>
  </main>
  <footer>Pagina generata il ${escapeHtml(formattaData(dati.generatoIl))}</footer>
</body>
</html>
`;
}
