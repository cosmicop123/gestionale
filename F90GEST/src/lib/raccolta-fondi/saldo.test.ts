import { describe, expect, it } from "vitest";
import { calcolaSaldoRaccolta } from "./saldo";

describe("calcolaSaldoRaccolta", () => {
  it("somma le entrate e sottrae le uscite", () => {
    const saldo = calcolaSaldoRaccolta([
      { tipo: "entrata", importo: 100 },
      { tipo: "entrata", importo: 50 },
      { tipo: "uscita", importo: 30 },
    ]);
    expect(saldo).toBe(120);
  });

  it("restituisce zero senza movimenti", () => {
    expect(calcolaSaldoRaccolta([])).toBe(0);
  });
});
