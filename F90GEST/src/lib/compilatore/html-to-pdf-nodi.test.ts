import { describe, expect, it } from "vitest";
import type { ReactElement, ReactNode } from "react";
import { costruisciNodiPdf } from "./html-to-pdf-nodi";

/** Estrae il testo semplice da un albero di elementi react-pdf (Text/View annidati), per verificare il contenuto senza dipendere dall'esatta forma dell'albero. */
function estraiTesto(nodo: ReactNode): string {
  if (nodo === null || nodo === undefined || typeof nodo === "boolean") return "";
  if (typeof nodo === "string" || typeof nodo === "number") return String(nodo);
  if (Array.isArray(nodo)) return nodo.map(estraiTesto).join("");
  const elemento = nodo as ReactElement<{ children?: ReactNode }>;
  return estraiTesto(elemento.props?.children);
}

/** Cerca il primo elemento (ricorsivamente) il cui style ha `grassetto: true` equivalente, qui verificato via fontWeight. */
function contieneStile(nodo: ReactNode, predicato: (style: Record<string, unknown> | undefined) => boolean): boolean {
  if (nodo === null || nodo === undefined || typeof nodo === "boolean" || typeof nodo === "string" || typeof nodo === "number") {
    return false;
  }
  if (Array.isArray(nodo)) return nodo.some((n) => contieneStile(n, predicato));
  const elemento = nodo as ReactElement<{ children?: ReactNode; style?: Record<string, unknown> }>;
  if (predicato(elemento.props?.style)) return true;
  return contieneStile(elemento.props?.children, predicato);
}

describe("costruisciNodiPdf", () => {
  it("rende un paragrafo semplice come testo", () => {
    const nodi = costruisciNodiPdf("<p>Ciao mondo</p>");
    expect(estraiTesto(nodi)).toBe("Ciao mondo");
  });

  it("mantiene il grassetto annidato dentro un paragrafo", () => {
    const nodi = costruisciNodiPdf("<p>Testo <b>importante</b> normale</p>");
    expect(estraiTesto(nodi)).toBe("Testo importante normale");
    expect(contieneStile(nodi, (s) => s?.fontWeight === 700)).toBe(true);
  });

  it("mantiene corsivo e sottolineato annidati", () => {
    const nodi = costruisciNodiPdf("<p><i>corsivo</i> e <u>sottolineato</u></p>");
    expect(contieneStile(nodi, (s) => s?.fontStyle === "italic")).toBe(true);
    expect(contieneStile(nodi, (s) => s?.textDecoration === "underline")).toBe(true);
  });

  it("converte un elenco puntato in una riga per voce con marcatore", () => {
    const nodi = costruisciNodiPdf("<ul><li>Uno</li><li>Due</li></ul>");
    expect(nodi).toHaveLength(2);
    expect(estraiTesto(nodi[0])).toBe("•Uno");
    expect(estraiTesto(nodi[1])).toBe("•Due");
  });

  it("converte un elenco numerato con marcatori progressivi", () => {
    const nodi = costruisciNodiPdf("<ol><li>Primo</li><li>Secondo</li></ol>");
    expect(estraiTesto(nodi[0])).toBe("1.Primo");
    expect(estraiTesto(nodi[1])).toBe("2.Secondo");
  });

  it("rende i titoli con una dimensione maggiore di un paragrafo normale", () => {
    const nodiTitolo = costruisciNodiPdf("<h1>Titolo</h1>");
    const nodiParagrafo = costruisciNodiPdf("<p>Paragrafo</p>");
    const fontSizeTitolo = (nodiTitolo[0] as ReactElement<{ style?: { fontSize?: number } }>).props.style?.fontSize ?? 0;
    const fontSizeParagrafo = (nodiParagrafo[0] as ReactElement<{ style?: { fontSize?: number } }>).props.style?.fontSize ?? 0;
    expect(fontSizeTitolo).toBeGreaterThan(fontSizeParagrafo);
  });

  it("scarta il contenuto di script e style senza farlo comparire nel testo", () => {
    const nodi = costruisciNodiPdf("<p>Testo visibile</p><script>alert('x')</script><style>p{color:red}</style>");
    expect(estraiTesto(nodi)).toBe("Testo visibile");
  });

  it("non perde il testo dentro un tag non riconosciuto (es. span)", () => {
    const nodi = costruisciNodiPdf("<span>Testo in uno span</span>");
    expect(estraiTesto(nodi)).toBe("Testo in uno span");
  });

  it("gestisce un div contenitore con più paragrafi figli", () => {
    const nodi = costruisciNodiPdf("<div><p>Primo</p><p>Secondo</p></div>");
    expect(nodi).toHaveLength(2);
    expect(estraiTesto(nodi[0])).toBe("Primo");
    expect(estraiTesto(nodi[1])).toBe("Secondo");
  });

  it("restituisce un array vuoto per un documento vuoto", () => {
    expect(costruisciNodiPdf("")).toEqual([]);
  });
});
