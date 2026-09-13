import { describe, expect, it } from "vitest";
import { calcolaStatoQuota } from "./stato-quota";

describe("calcolaStatoQuota", () => {
  it("è 'da_pagare' senza alcun pagamento", () => {
    expect(calcolaStatoQuota(30, 0)).toBe("da_pagare");
  });

  it("è 'parziale' se il totale pagato è inferiore alla quota", () => {
    expect(calcolaStatoQuota(30, 10)).toBe("parziale");
  });

  it("è 'pagata' se il totale pagato eguaglia la quota", () => {
    expect(calcolaStatoQuota(30, 30)).toBe("pagata");
  });

  it("è 'pagata' anche se il totale pagato supera la quota", () => {
    expect(calcolaStatoQuota(30, 35)).toBe("pagata");
  });
});
