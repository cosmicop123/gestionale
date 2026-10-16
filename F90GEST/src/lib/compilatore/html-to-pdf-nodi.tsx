import { parse, HTMLElement, NodeType, type Node } from "node-html-parser";
import { Text, View, StyleSheet } from "@react-pdf/renderer";
import type { ReactElement } from "react";

/**
 * Converte l'HTML prodotto dall'editor del Compilatore (§ nota fuori
 * milestone) in primitivi @react-pdf/renderer (Text/View), che non accetta
 * HTML arbitrario. L'editor usa `document.execCommand` del browser, quindi
 * il sottoinsieme di tag da gestire è piccolo e noto in anticipo
 * (p/div, h1-h3, b/strong, i/em, u, ul/ol/li, br, hr) — non un parser HTML
 * generico. Qualunque tag non riconosciuto (es. un <span> di stile incollato
 * da un editor esterno) viene trattato come un contenitore generico, per non
 * perdere il testo; `<script>`/`<style>` vengono scartati per intero (anche
 * i figli), unico caso in cui si perde volutamente del contenuto.
 */

const stili = StyleSheet.create({
  paragrafo: { marginBottom: 8, fontSize: 10, lineHeight: 1.5 },
  h1: { marginTop: 4, marginBottom: 8, fontSize: 16, fontWeight: 700 },
  h2: { marginTop: 4, marginBottom: 8, fontSize: 13, fontWeight: 700 },
  h3: { marginTop: 4, marginBottom: 6, fontSize: 11, fontWeight: 700 },
  rigaLista: { flexDirection: "row", marginBottom: 4 },
  marcatoreLista: { width: 20, fontSize: 10 },
  contenutoLista: { flex: 1, fontSize: 10, lineHeight: 1.5 },
  separatore: { borderBottom: 1, borderBottomColor: "#cccccc", marginTop: 8, marginBottom: 8 },
});

const TAG_TITOLO: Record<string, keyof typeof stili> = { h1: "h1", h2: "h2", h3: "h3" };
const TAG_GRASSETTO = new Set(["b", "strong"]);
const TAG_CORSIVO = new Set(["i", "em"]);
const TAG_SOTTOLINEATO = new Set(["u"]);
const TAG_BLOCCO = new Set(["p", "div", "h1", "h2", "h3", "ul", "ol", "li", "hr", "br"]);

type StileInline = { grassetto: boolean; corsivo: boolean; sottolineato: boolean };

function stileTestoInline(stile: StileInline) {
  return {
    fontWeight: stile.grassetto ? (700 as const) : undefined,
    fontStyle: stile.corsivo ? ("italic" as const) : undefined,
    textDecoration: stile.sottolineato ? ("underline" as const) : undefined,
  };
}

function isElemento(nodo: Node): nodo is HTMLElement {
  return nodo.nodeType === NodeType.ELEMENT_NODE;
}

/** Rende il contenuto inline di un blocco (testo semplice + tag di formattazione annidati). */
function renderizzaInline(nodo: Node, stile: StileInline, chiave: string): ReactElement | null {
  if (nodo.nodeType === NodeType.TEXT_NODE) {
    if (!nodo.text) return null;
    return (
      <Text key={chiave} style={stileTestoInline(stile)}>
        {nodo.text}
      </Text>
    );
  }
  if (!isElemento(nodo)) return null;
  const tag = nodo.rawTagName?.toLowerCase() ?? "";
  if (tag === "script" || tag === "style") return null;
  if (tag === "br") {
    return <Text key={chiave}>{"\n"}</Text>;
  }

  const nuovoStile: StileInline = {
    grassetto: stile.grassetto || TAG_GRASSETTO.has(tag),
    corsivo: stile.corsivo || TAG_CORSIVO.has(tag),
    sottolineato: stile.sottolineato || TAG_SOTTOLINEATO.has(tag),
  };
  const figli = nodo.childNodes
    .map((figlio, indice) => renderizzaInline(figlio, nuovoStile, `${chiave}-${indice}`))
    .filter((f): f is ReactElement => f !== null);
  if (figli.length === 0) return null;
  return <Text key={chiave}>{figli}</Text>;
}

function testoInlinePiatto(nodo: Node, stileIniziale: StileInline, chiavePrefisso: string): ReactElement[] {
  return nodo.childNodes
    .map((figlio, indice) => renderizzaInline(figlio, stileIniziale, `${chiavePrefisso}-${indice}`))
    .filter((f): f is ReactElement => f !== null);
}

/** Rende un blocco (paragrafo, titolo, lista, separatore) e i suoi eventuali blocchi figli. */
function renderizzaBlocco(nodo: Node, chiave: string): ReactElement | ReactElement[] | null {
  if (nodo.nodeType === NodeType.TEXT_NODE) {
    if (!nodo.text?.trim()) return null;
    return (
      <Text key={chiave} style={stili.paragrafo}>
        {nodo.text}
      </Text>
    );
  }
  if (!isElemento(nodo)) return null;

  const tag = nodo.rawTagName?.toLowerCase() ?? "";
  if (tag === "script" || tag === "style") return null;
  if (tag === "br") return null; // un <br> isolato a livello di blocco non produce un paragrafo vuoto

  if (tag === "hr") {
    return <View key={chiave} style={stili.separatore} />;
  }

  if (tag in TAG_TITOLO) {
    const contenuto = testoInlinePiatto(nodo, { grassetto: false, corsivo: false, sottolineato: false }, chiave);
    if (contenuto.length === 0) return null;
    return (
      <Text key={chiave} style={stili[TAG_TITOLO[tag]]}>
        {contenuto}
      </Text>
    );
  }

  if (tag === "ul" || tag === "ol") {
    const voci = nodo.childNodes.filter((f) => isElemento(f) && f.rawTagName?.toLowerCase() === "li");
    return voci.map((voce, indice) => {
      const contenuto = testoInlinePiatto(voce, { grassetto: false, corsivo: false, sottolineato: false }, `${chiave}-li-${indice}`);
      return (
        <View key={`${chiave}-li-${indice}`} style={stili.rigaLista}>
          <Text style={stili.marcatoreLista}>{tag === "ul" ? "•" : `${indice + 1}.`}</Text>
          <Text style={stili.contenutoLista}>{contenuto}</Text>
        </View>
      );
    });
  }

  if (tag === "li") {
    // <li> fuori da un <ul>/<ol> (HTML non valido ma possibile da un editor): trattato come paragrafo normale.
    const contenuto = testoInlinePiatto(nodo, { grassetto: false, corsivo: false, sottolineato: false }, chiave);
    if (contenuto.length === 0) return null;
    return (
      <Text key={chiave} style={stili.paragrafo}>
        {contenuto}
      </Text>
    );
  }

  if (tag === "p" || tag === "div") {
    // Un blocco può contenere sia testo/formattazione inline sia, a sua volta, altri blocchi
    // (es. un <div> che racchiude due <p>, come capita incollando testo da un altro editor):
    // se non trova blocchi figli espliciti lo tratta come un singolo paragrafo di testo inline.
    const haFigliBlocco = nodo.childNodes.some((f) => isElemento(f) && TAG_BLOCCO.has(f.rawTagName?.toLowerCase() ?? ""));
    if (haFigliBlocco) {
      return nodo.childNodes.flatMap((figlio, indice) => {
        const risultato = renderizzaBlocco(figlio, `${chiave}-${indice}`);
        return risultato === null ? [] : Array.isArray(risultato) ? risultato : [risultato];
      });
    }
    const contenuto = testoInlinePiatto(nodo, { grassetto: false, corsivo: false, sottolineato: false }, chiave);
    if (contenuto.length === 0) return null;
    return (
      <Text key={chiave} style={stili.paragrafo}>
        {contenuto}
      </Text>
    );
  }

  // Tag non riconosciuto (es. <span>, <a>, <font>...): non si perde il contenuto, si tratta
  // come un paragrafo generico mantenendo solo il testo/formattazione annidata.
  const contenuto = testoInlinePiatto(nodo, { grassetto: false, corsivo: false, sottolineato: false }, chiave);
  if (contenuto.length === 0) return null;
  return (
    <Text key={chiave} style={stili.paragrafo}>
      {contenuto}
    </Text>
  );
}

/** Punto d'ingresso: HTML dell'editor -> array di elementi @react-pdf/renderer pronti per una `<Page>`. */
export function costruisciNodiPdf(html: string): ReactElement[] {
  const radice = parse(html);
  return radice.childNodes.flatMap((nodo, indice) => {
    const risultato = renderizzaBlocco(nodo, `blocco-${indice}`);
    if (risultato === null) return [];
    return Array.isArray(risultato) ? risultato : [risultato];
  });
}
