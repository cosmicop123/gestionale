import { describe, expect, it } from "vitest";
import { schemaEnte } from "./ente";

const datiBase = {
  denominazione: "Associazione Culturale Frequenze 90",
  codiceFiscale: "12345678901",
  sedeLegaleVia: "Via Roma 1",
  sedeLegaleCap: "72025",
  sedeLegaleComune: "San Donaci",
  sedeLegaleProvincia: "br",
  iscrittoRunts: false,
};

describe("schemaEnte", () => {
  it("accetta dati validi e normalizza la provincia in maiuscolo", () => {
    const risultato = schemaEnte.safeParse(datiBase);
    expect(risultato.success).toBe(true);
    if (risultato.success) {
      expect(risultato.data.sedeLegaleProvincia).toBe("BR");
    }
  });

  it("rifiuta un codice fiscale che non sia di 11 cifre numeriche", () => {
    const risultato = schemaEnte.safeParse({ ...datiBase, codiceFiscale: "ABC123" });
    expect(risultato.success).toBe(false);
  });

  it("rifiuta un CAP che non sia di 5 cifre", () => {
    const risultato = schemaEnte.safeParse({ ...datiBase, sedeLegaleCap: "123" });
    expect(risultato.success).toBe(false);
  });

  it("richiede la denominazione", () => {
    const risultato = schemaEnte.safeParse({ ...datiBase, denominazione: "" });
    expect(risultato.success).toBe(false);
  });
});
