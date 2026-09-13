import { describe, expect, it } from "vitest";
import { calcolaPresenze, haDirittoAttestato } from "./calcolo-presenze";

describe("calcolaPresenze", () => {
  it("conta come frequentate le ore delle lezioni con presenza 'presente'", () => {
    const esito = calcolaPresenze([
      { durataOre: 2, statoLezione: "svolta", statoPresenza: "presente" },
      { durataOre: 2, statoLezione: "svolta", statoPresenza: "presente" },
    ]);
    expect(esito.oreTotaliSvolte).toBe(4);
    expect(esito.oreFrequentate).toBe(4);
    expect(esito.percentualePresenza).toBe(100);
  });

  it("conta come frequentate anche le lezioni con presenza 'ritardo'", () => {
    const esito = calcolaPresenze([{ durataOre: 3, statoLezione: "svolta", statoPresenza: "ritardo" }]);
    expect(esito.oreFrequentate).toBe(3);
  });

  it("non conta le ore di lezioni con presenza 'assente'", () => {
    const esito = calcolaPresenze([
      { durataOre: 2, statoLezione: "svolta", statoPresenza: "presente" },
      { durataOre: 2, statoLezione: "svolta", statoPresenza: "assente" },
    ]);
    expect(esito.oreTotaliSvolte).toBe(4);
    expect(esito.oreFrequentate).toBe(2);
    expect(esito.percentualePresenza).toBe(50);
  });

  it("non conta le ore di lezioni con presenza 'giustificato'", () => {
    const esito = calcolaPresenze([
      { durataOre: 2, statoLezione: "svolta", statoPresenza: "presente" },
      { durataOre: 2, statoLezione: "svolta", statoPresenza: "giustificato" },
    ]);
    expect(esito.oreFrequentate).toBe(2);
    expect(esito.percentualePresenza).toBe(50);
  });

  it("esclude dal denominatore le lezioni non ancora svolte (programmata, rinviata, annullata)", () => {
    const esito = calcolaPresenze([
      { durataOre: 2, statoLezione: "svolta", statoPresenza: "presente" },
      { durataOre: 2, statoLezione: "programmata", statoPresenza: null },
      { durataOre: 2, statoLezione: "rinviata", statoPresenza: null },
      { durataOre: 2, statoLezione: "annullata", statoPresenza: null },
    ]);
    expect(esito.oreTotaliSvolte).toBe(2);
    expect(esito.oreFrequentate).toBe(2);
    expect(esito.percentualePresenza).toBe(100);
  });

  it("restituisce percentuale 0 quando non ci sono ancora lezioni svolte", () => {
    const esito = calcolaPresenze([{ durataOre: 2, statoLezione: "programmata", statoPresenza: null }]);
    expect(esito.oreTotaliSvolte).toBe(0);
    expect(esito.oreFrequentate).toBe(0);
    expect(esito.percentualePresenza).toBe(0);
  });

  it("gestisce una lezione svolta senza presenza rilevata come non frequentata", () => {
    const esito = calcolaPresenze([{ durataOre: 2, statoLezione: "svolta", statoPresenza: null }]);
    expect(esito.oreFrequentate).toBe(0);
    expect(esito.percentualePresenza).toBe(0);
  });
});

describe("haDirittoAttestato", () => {
  it("ha diritto quando la percentuale è sopra la soglia", () => {
    expect(haDirittoAttestato(75, 70)).toBe(true);
  });

  it("ha diritto quando la percentuale è esattamente sulla soglia", () => {
    expect(haDirittoAttestato(70, 70)).toBe(true);
  });

  it("non ha diritto quando la percentuale è sotto la soglia", () => {
    expect(haDirittoAttestato(69.9, 70)).toBe(false);
  });
});
