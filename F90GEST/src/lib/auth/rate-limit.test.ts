import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { verificaELimitaTentativi, azzeraTentativi } from "./rate-limit";

describe("verificaELimitaTentativi", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("consente i primi tentativi entro la soglia", () => {
    const chiave = `test-${Math.random()}`;
    for (let i = 0; i < 5; i++) {
      expect(verificaELimitaTentativi(chiave).consentito).toBe(true);
    }
  });

  it("blocca dopo aver superato il numero massimo di tentativi nella finestra", () => {
    const chiave = `test-${Math.random()}`;
    for (let i = 0; i < 5; i++) {
      verificaELimitaTentativi(chiave);
    }
    const esito = verificaELimitaTentativi(chiave);
    expect(esito.consentito).toBe(false);
    expect(esito.riprovaTraSecondi).toBeGreaterThan(0);
  });

  it("azzeraTentativi sblocca immediatamente la chiave", () => {
    const chiave = `test-${Math.random()}`;
    for (let i = 0; i < 6; i++) {
      verificaELimitaTentativi(chiave);
    }
    expect(verificaELimitaTentativi(chiave).consentito).toBe(false);

    azzeraTentativi(chiave);
    expect(verificaELimitaTentativi(chiave).consentito).toBe(true);
  });

  it("riapre i tentativi dopo lo scadere della finestra temporale", () => {
    const chiave = `test-${Math.random()}`;
    for (let i = 0; i < 6; i++) {
      verificaELimitaTentativi(chiave);
    }
    expect(verificaELimitaTentativi(chiave).consentito).toBe(false);

    vi.advanceTimersByTime(1000 * 60 * 16);
    expect(verificaELimitaTentativi(chiave).consentito).toBe(true);
  });
});
