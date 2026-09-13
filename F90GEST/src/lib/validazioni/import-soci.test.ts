import { describe, expect, it } from "vitest";
import { validaRigaImport } from "./import-soci";

describe("validaRigaImport", () => {
  it("accetta una riga completa e valida", () => {
    const risultato = validaRigaImport(
      {
        nome: "Mario",
        cognome: "Rossi",
        codiceFiscale: "RSSMRA85M01H501Q",
        dataNascita: "01/08/1985",
        email: "mario.rossi@esempio.it",
      },
      0
    );
    expect(risultato.valida).toBe(true);
    expect(risultato.dati.codiceFiscale).toBe("RSSMRA85M01H501Q");
    expect(risultato.dati.dataNascita).toEqual(new Date(1985, 7, 1));
  });

  it("segnala nome e cognome mancanti", () => {
    const risultato = validaRigaImport({}, 0);
    expect(risultato.valida).toBe(false);
    expect(risultato.errori).toContain("Nome mancante.");
    expect(risultato.errori).toContain("Cognome mancante.");
  });

  it("segnala un codice fiscale non valido senza bloccare l'intera riga dagli altri controlli", () => {
    const risultato = validaRigaImport(
      { nome: "Mario", cognome: "Rossi", codiceFiscale: "NONVALIDO" },
      0
    );
    expect(risultato.valida).toBe(false);
    expect(risultato.errori.some((e) => e.startsWith("Codice fiscale"))).toBe(true);
  });

  it("segnala un'email non valida", () => {
    const risultato = validaRigaImport(
      { nome: "Mario", cognome: "Rossi", email: "non-una-email" },
      0
    );
    expect(risultato.valida).toBe(false);
  });

  it("usa 'ordinario' come categoria di default per un valore non riconosciuto", () => {
    const risultato = validaRigaImport(
      { nome: "Mario", cognome: "Rossi", categoria: "categoria-inventata" },
      0
    );
    expect(risultato.dati.categoria).toBe("ordinario");
  });

  it("accetta una categoria valida esplicita", () => {
    const risultato = validaRigaImport(
      { nome: "Mario", cognome: "Rossi", categoria: "sostenitore" },
      0
    );
    expect(risultato.dati.categoria).toBe("sostenitore");
  });

  it("segnala un numero di libro soci non intero positivo", () => {
    const risultato = validaRigaImport(
      { nome: "Mario", cognome: "Rossi", numeroLibroSoci: "-3" },
      0
    );
    expect(risultato.valida).toBe(false);
  });

  it("accetta la data in formato italiano e in formato ISO", () => {
    const italiano = validaRigaImport({ nome: "A", cognome: "B", dataNascita: "15/03/1990" }, 0);
    const iso = validaRigaImport({ nome: "A", cognome: "B", dataNascita: "1990-03-15" }, 0);
    expect(italiano.dati.dataNascita).toEqual(new Date(1990, 2, 15));
    expect(iso.dati.dataNascita).toEqual(new Date(1990, 2, 15));
  });
});
