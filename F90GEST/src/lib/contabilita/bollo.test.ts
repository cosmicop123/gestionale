import { describe, expect, it } from "vitest";
import { calcolaBollo } from "./bollo";

const BASE = {
  sogliaBolloEuro: 77.47,
  importoBolloEuro: 2.0,
  natureFiscaliSoggetteABollo: ["corrispettivo_specifico", "attivita_commerciale"],
};

describe("calcolaBollo", () => {
  it("non applica il bollo sotto soglia anche per una natura soggetta", () => {
    const risultato = calcolaBollo({ ...BASE, importo: 50, naturaFiscale: "corrispettivo_specifico" });
    expect(risultato.applicato).toBe(false);
    expect(risultato.importo).toBeNull();
  });

  it("non applica il bollo esattamente alla soglia (oltre, non da)", () => {
    const risultato = calcolaBollo({ ...BASE, importo: 77.47, naturaFiscale: "corrispettivo_specifico" });
    expect(risultato.applicato).toBe(false);
  });

  it("applica il bollo sopra soglia per una natura soggetta", () => {
    const risultato = calcolaBollo({ ...BASE, importo: 100, naturaFiscale: "corrispettivo_specifico" });
    expect(risultato.applicato).toBe(true);
    expect(risultato.importo).toBe(2.0);
  });

  it("non applica il bollo per una natura non soggetta, anche sopra soglia", () => {
    const risultato = calcolaBollo({ ...BASE, importo: 200, naturaFiscale: "quota_associativa" });
    expect(risultato.applicato).toBe(false);
  });
});
