import type { DatiSitoPubblico } from "../dati";
import { escapeHtml, escapeHtmlConACapo } from "../escape-html";
import { formattaPeriodoCorso, formattaData } from "../formattazione";

export function generaHtmlVivace(dati: DatiSitoPubblico): string {
  const corsi = dati.corsi
    .map(
      (c, i) => `
      <article class="corso corso-${i % 3}">
        <h3>${escapeHtml(c.titolo)}</h3>
        <p class="meta">${escapeHtml(formattaPeriodoCorso(c.dataInizio, c.dataFine))}${c.sede ? ` · ${escapeHtml(c.sede)}` : ""}</p>
        ${c.descrizione ? `<p>${escapeHtmlConACapo(c.descrizione)}</p>` : ""}
        <div class="riga-finale">
          ${c.quotaPartecipazione ? `<span class="quota">€ ${escapeHtml(c.quotaPartecipazione)}</span>` : `<span class="quota">gratuito</span>`}
          ${c.linkIscrizione ? `<a class="bottone" href="${escapeHtml(c.linkIscrizione)}">Iscriviti →</a>` : ""}
        </div>
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
    font-family: "Trebuchet MS", Verdana, sans-serif;
    background: #fff8ef;
    color: #4a2c1a;
    line-height: 1.6;
  }
  header {
    background: linear-gradient(135deg, #d9622b, #e8a33d);
    color: #fff;
    padding: 3.5rem 1.5rem;
    text-align: center;
    border-bottom-left-radius: 40px;
    border-bottom-right-radius: 40px;
  }
  header h1 { margin: 0 0 .5rem; font-size: 2.5rem; }
  header p { margin: 0; opacity: .95; }
  main { max-width: 860px; margin: 0 auto; padding: 2.5rem 1.5rem; }
  section { margin-bottom: 2.5rem; }
  h2 { font-size: 1.6rem; color: #d9622b; margin-bottom: 1.2rem; }
  .intro { background: #fff; border-radius: 22px; padding: 1.5rem 1.8rem; box-shadow: 0 4px 14px rgba(74,44,26,.08); }
  .corso {
    border-radius: 22px;
    padding: 1.4rem 1.6rem;
    margin-bottom: 1.1rem;
    box-shadow: 0 4px 14px rgba(74,44,26,.08);
  }
  .corso-0 { background: #ffe9d6; }
  .corso-1 { background: #fdeccb; }
  .corso-2 { background: #ffe0e0; }
  .corso h3 { margin: 0 0 .3rem; }
  .corso .meta { margin: 0 0 .6rem; font-size: .9rem; color: #7a4a2f; }
  .riga-finale { display: flex; align-items: center; justify-content: space-between; margin-top: .8rem; flex-wrap: wrap; gap: .6rem; }
  .quota { font-weight: bold; color: #d9622b; }
  .bottone {
    display: inline-block;
    padding: .5rem 1.2rem;
    background: #d9622b;
    color: #fff;
    text-decoration: none;
    border-radius: 999px;
    font-weight: bold;
  }
  .bottone:hover { background: #b74e1e; }
  .contatti { background: #fff; border-radius: 22px; padding: 1.5rem 1.8rem; box-shadow: 0 4px 14px rgba(74,44,26,.08); }
  .contatti p { margin: .3rem 0; }
  footer { text-align: center; padding: 2rem 1.5rem; color: #a8815f; font-size: .8rem; }
</style>
</head>
<body>
  <header>
    <h1>${escapeHtml(dati.denominazione)}</h1>
    <p>${escapeHtml(dati.indirizzo)}</p>
  </header>
  <main>
    ${dati.presentazione ? `<section><div class="intro"><h2>Chi siamo</h2><p>${escapeHtmlConACapo(dati.presentazione)}</p></div></section>` : ""}
    <section>
      <h2>Corsi disponibili</h2>
      ${corsi || "<p>Nessun corso attualmente aperto alle iscrizioni.</p>"}
    </section>
    <section>
      <div class="contatti">
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
