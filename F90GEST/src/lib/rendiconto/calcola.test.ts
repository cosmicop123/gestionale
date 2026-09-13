import { describe, expect, it } from "vitest";
import { calcolaRendiconto } from "./calcola";

const mappatura = {
  quote_associative: "A",
  raccolte_fondi: "C",
  acquisti_beni_servizi: "A",
  oneri_diversi_gestione: "E",
};

describe("calcolaRendiconto", () => {
  it("somma entrate e uscite nella sezione corretta secondo la mappatura", () => {
    const rendiconto = calcolaRendiconto(
      [
        { tipo: "entrata", importo: 100, categoriaRendiconto: "quote_associative" },
        { tipo: "entrata", importo: 50, categoriaRendiconto: "raccolte_fondi" },
        { tipo: "uscita", importo: 30, categoriaRendiconto: "acquisti_beni_servizi" },
      ],
      mappatura,
      false
    );

    const sezioneA = rendiconto.sezioni.find((s) => s.sezione === "A")!;
    expect(sezioneA.entrate).toBe(100);
    expect(sezioneA.uscite).toBe(30);
    expect(sezioneA.avanzo).toBe(70);

    const sezioneC = rendiconto.sezioni.find((s) => s.sezione === "C")!;
    expect(sezioneC.entrate).toBe(50);

    expect(rendiconto.totaleEntrate).toBe(150);
    expect(rendiconto.totaleUscite).toBe(30);
    expect(rendiconto.avanzoDisavanzo).toBe(120);
  });

  it("aggrega più movimenti della stessa categoria in un'unica riga di dettaglio", () => {
    const rendiconto = calcolaRendiconto(
      [
        { tipo: "entrata", importo: 100, categoriaRendiconto: "quote_associative" },
        { tipo: "entrata", importo: 25, categoriaRendiconto: "quote_associative" },
      ],
      mappatura,
      false
    );
    const sezioneA = rendiconto.sezioni.find((s) => s.sezione === "A")!;
    expect(sezioneA.dettaglioEntrate).toEqual([{ categoria: "quote_associative", importo: 125 }]);
  });

  it("in forma aggregata non produce alcun dettaglio per categoria", () => {
    const rendiconto = calcolaRendiconto(
      [{ tipo: "entrata", importo: 100, categoriaRendiconto: "quote_associative" }],
      mappatura,
      true
    );
    const sezioneA = rendiconto.sezioni.find((s) => s.sezione === "A")!;
    expect(sezioneA.dettaglioEntrate).toEqual([]);
    expect(sezioneA.entrate).toBe(100);
  });

  it("segnala le categorie prive di mappatura invece di scartarle silenziosamente", () => {
    const rendiconto = calcolaRendiconto(
      [{ tipo: "entrata", importo: 40, categoriaRendiconto: "categoria_sconosciuta" }],
      mappatura,
      false
    );
    expect(rendiconto.categorieNonMappate).toEqual(["categoria_sconosciuta"]);
    // Il totale generale resta comunque corretto anche se non attribuibile a una sezione.
    expect(rendiconto.totaleEntrate).toBe(40);
    expect(rendiconto.sezioni.every((s) => s.entrate === 0)).toBe(true);
  });

  it("calcola un avanzo/disavanzo negativo quando le uscite superano le entrate", () => {
    const rendiconto = calcolaRendiconto(
      [
        { tipo: "entrata", importo: 10, categoriaRendiconto: "quote_associative" },
        { tipo: "uscita", importo: 30, categoriaRendiconto: "oneri_diversi_gestione" },
      ],
      mappatura,
      false
    );
    expect(rendiconto.avanzoDisavanzo).toBe(-20);
  });
});
