import { describe, expect, it } from "vitest";
import {
  calcolaCarattereControllo,
  decodificaCodiceFiscale,
  validaCodiceFiscale,
} from "./codice-fiscale";

// Esempio: "Mario Rossi", nato l'1/8/1985 a Roma (codice catastale H501).
// Il carattere di controllo (Q) è stato verificato sia a mano seguendo le
// tabelle ufficiali sia confrontando il calcolo con la libreria
// indipendente "codice-fiscale-js" (stesse tabelle, stesso algoritmo).
const CF_MARIO_ROSSI = "RSSMRA85M01H501Q";
const CF_MARIO_ROSSI_15 = CF_MARIO_ROSSI.slice(0, 15);

describe("calcolaCarattereControllo", () => {
  it("calcola il carattere di controllo corretto per un codice fiscale noto", () => {
    expect(calcolaCarattereControllo(CF_MARIO_ROSSI_15)).toBe("Q");
  });
});

describe("decodificaCodiceFiscale", () => {
  it("estrae anno, mese, giorno e sesso per un maschio", () => {
    expect(decodificaCodiceFiscale(CF_MARIO_ROSSI)).toEqual({
      annoADueCifre: 85,
      mese: 8,
      giorno: 1,
      sesso: "M",
    });
  });

  it("riconosce una femmina dal giorno aumentato di 40", () => {
    const base15 = "RSSMRA85M41H501"; // giorno 01 + 40 = femmina
    const check = calcolaCarattereControllo(base15);
    expect(decodificaCodiceFiscale(base15 + check)).toEqual({
      annoADueCifre: 85,
      mese: 8,
      giorno: 1,
      sesso: "F",
    });
  });

  it("gestisce l'omocodia (cifra sostituita da lettera in posizione numerica)", () => {
    // Sostituisce la seconda cifra dell'anno ("5" in "85") con la lettera
    // di omocodia corrispondente ("R"), come da tabella ministeriale.
    const base15ConOmocodia = CF_MARIO_ROSSI_15.slice(0, 7) + "R" + CF_MARIO_ROSSI_15.slice(8);
    const check = calcolaCarattereControllo(base15ConOmocodia);
    expect(decodificaCodiceFiscale(base15ConOmocodia + check)).toEqual({
      annoADueCifre: 85,
      mese: 8,
      giorno: 1,
      sesso: "M",
    });
  });

  it("restituisce null per un formato non valido", () => {
    expect(decodificaCodiceFiscale("NON-VALIDO")).toBeNull();
  });
});

describe("validaCodiceFiscale", () => {
  it("valida un codice fiscale corretto e coerente con la data di nascita e il sesso", () => {
    const risultato = validaCodiceFiscale(CF_MARIO_ROSSI, {
      dataNascita: new Date(1985, 7, 1),
      sesso: "M",
    });
    expect(risultato.valido).toBe(true);
    expect(risultato.errori).toHaveLength(0);
  });

  it("accetta il codice fiscale anche in minuscolo", () => {
    expect(validaCodiceFiscale(CF_MARIO_ROSSI.toLowerCase()).valido).toBe(true);
  });

  it("rifiuta un carattere di controllo errato", () => {
    const cfConCheckSbagliato = CF_MARIO_ROSSI_15 + "A";
    const risultato = validaCodiceFiscale(cfConCheckSbagliato);
    expect(risultato.valido).toBe(false);
    expect(risultato.errori[0]).toMatch(/carattere di controllo/i);
  });

  it("rifiuta un formato non valido", () => {
    expect(validaCodiceFiscale("ABC123").valido).toBe(false);
  });

  it("segnala l'incoerenza con la data di nascita dichiarata", () => {
    const risultato = validaCodiceFiscale(CF_MARIO_ROSSI, {
      dataNascita: new Date(1990, 0, 15),
    });
    expect(risultato.valido).toBe(false);
    expect(risultato.errori.some((e) => /data di nascita/i.test(e))).toBe(true);
  });

  it("segnala l'incoerenza con il sesso dichiarato", () => {
    const risultato = validaCodiceFiscale(CF_MARIO_ROSSI, { sesso: "F" });
    expect(risultato.valido).toBe(false);
    expect(risultato.errori.some((e) => /sesso/i.test(e))).toBe(true);
  });
});
