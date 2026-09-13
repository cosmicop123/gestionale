import { describe, expect, it } from "vitest";
import { schemaIscrizionePubblica } from "./consenso";
import { calcolaCarattereControllo } from "@/lib/persona/codice-fiscale";

function codiceFiscaleMinorenne(): { codiceFiscale: string; dataNascita: string } {
  const annoNascita = new Date().getFullYear() - 10;
  const primi15 = `RSSMRA${String(annoNascita).slice(-2)}M01H501`;
  return {
    codiceFiscale: primi15 + calcolaCarattereControllo(primi15),
    dataNascita: `${annoNascita}-08-01`,
  };
}

const baseValida = {
  nome: "Mario",
  cognome: "Rossi",
  codiceFiscale: "RSSMRA85M01H501Q",
  dataNascita: "1985-08-01",
  email: "mario.rossi@example.com",
  telefono: "",
  consensoTrattamento: true,
  consensoImmagini: false,
  consensoNewsletter: false,
  consensoTerzi: false,
};

describe("schemaIscrizionePubblica", () => {
  it("accetta dati validi con solo il consenso obbligatorio", () => {
    const risultato = schemaIscrizionePubblica.safeParse(baseValida);
    expect(risultato.success).toBe(true);
  });

  it("rifiuta se manca il consenso al trattamento dei dati", () => {
    const risultato = schemaIscrizionePubblica.safeParse({ ...baseValida, consensoTrattamento: false });
    expect(risultato.success).toBe(false);
  });

  it("rifiuta se manca ogni contatto (email e telefono)", () => {
    const risultato = schemaIscrizionePubblica.safeParse({ ...baseValida, email: "", telefono: "" });
    expect(risultato.success).toBe(false);
  });

  it("richiede i dati del genitore per una persona minorenne", () => {
    const risultato = schemaIscrizionePubblica.safeParse({
      ...baseValida,
      ...codiceFiscaleMinorenne(),
    });
    expect(risultato.success).toBe(false);
  });

  it("accetta un minorenne quando i dati del genitore sono presenti", () => {
    const risultato = schemaIscrizionePubblica.safeParse({
      ...baseValida,
      ...codiceFiscaleMinorenne(),
      genitore: {
        genitoreNomeCognome: "Anna Rossi",
        genitoreCodiceFiscale: "",
        genitoreEmail: "",
        genitoreTelefono: "",
        gradoParentela: "genitore",
      },
    });
    expect(risultato.success).toBe(true);
  });

  it("richiede almeno un canale se si concede il consenso immagini", () => {
    const risultato = schemaIscrizionePubblica.safeParse({
      ...baseValida,
      consensoImmagini: true,
      canaliImmagini: [],
    });
    expect(risultato.success).toBe(false);
  });

  it("accetta il consenso immagini con almeno un canale selezionato", () => {
    const risultato = schemaIscrizionePubblica.safeParse({
      ...baseValida,
      consensoImmagini: true,
      canaliImmagini: ["sito"],
    });
    expect(risultato.success).toBe(true);
  });
});
