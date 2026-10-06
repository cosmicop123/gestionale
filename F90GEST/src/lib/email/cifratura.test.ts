import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { cifraSegreto, decifraSegreto } from "./cifratura";

describe("cifraSegreto / decifraSegreto", () => {
  const segretoOriginale = process.env.EMAIL_CIFRATURA_SECRET;

  beforeEach(() => {
    process.env.EMAIL_CIFRATURA_SECRET = "segreto-di-test-non-usare-in-produzione";
  });

  afterEach(() => {
    process.env.EMAIL_CIFRATURA_SECRET = segretoOriginale;
  });

  it("cifra e decifra correttamente un testo", () => {
    const originale = "SuperSegreta!2026";
    const cifrato = cifraSegreto(originale);
    expect(cifrato).not.toContain(originale);
    expect(decifraSegreto(cifrato)).toBe(originale);
  });

  it("produce output diversi per la stessa password (IV casuale)", () => {
    const a = cifraSegreto("stessaPassword");
    const b = cifraSegreto("stessaPassword");
    expect(a).not.toBe(b);
  });

  it("lancia un errore chiaro se EMAIL_CIFRATURA_SECRET non è configurato", () => {
    delete process.env.EMAIL_CIFRATURA_SECRET;
    expect(() => cifraSegreto("qualcosa")).toThrow(/EMAIL_CIFRATURA_SECRET/);
  });
});
