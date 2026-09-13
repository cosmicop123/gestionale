import { describe, expect, it } from "vitest";
import { calcolaSaldoConto } from "./saldo";

describe("calcolaSaldoConto", () => {
  it("restituisce il saldo iniziale senza movimenti", () => {
    expect(calcolaSaldoConto(100, [])).toBe(100);
  });

  it("somma le entrate e sottrae le uscite", () => {
    const movimenti = [
      { tipo: "entrata", importo: 50 },
      { tipo: "uscita", importo: 20 },
      { tipo: "entrata", importo: 10 },
    ];
    expect(calcolaSaldoConto(100, movimenti)).toBe(140);
  });

  it("può risultare negativo", () => {
    expect(calcolaSaldoConto(10, [{ tipo: "uscita", importo: 50 }])).toBe(-40);
  });
});
