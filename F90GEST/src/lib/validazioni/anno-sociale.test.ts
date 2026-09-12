import { describe, expect, it } from "vitest";
import { schemaAnnoSociale } from "./anno-sociale";

describe("schemaAnnoSociale", () => {
  it("accetta un intervallo di date valido", () => {
    const risultato = schemaAnnoSociale.safeParse({
      etichetta: "2026/2027",
      dataInizio: "2026-09-01",
      dataFine: "2027-08-31",
    });
    expect(risultato.success).toBe(true);
  });

  it("rifiuta una data di fine antecedente o uguale alla data di inizio", () => {
    const risultatoUguale = schemaAnnoSociale.safeParse({
      etichetta: "2026/2027",
      dataInizio: "2026-09-01",
      dataFine: "2026-09-01",
    });
    expect(risultatoUguale.success).toBe(false);

    const risultatoAntecedente = schemaAnnoSociale.safeParse({
      etichetta: "2026/2027",
      dataInizio: "2027-08-31",
      dataFine: "2026-09-01",
    });
    expect(risultatoAntecedente.success).toBe(false);
  });

  it("richiede l'etichetta", () => {
    const risultato = schemaAnnoSociale.safeParse({
      etichetta: "",
      dataInizio: "2026-09-01",
      dataFine: "2027-08-31",
    });
    expect(risultato.success).toBe(false);
  });
});
