import { describe, expect, it } from "vitest";
import { sostituisciVariabili } from "./template";

describe("sostituisciVariabili", () => {
  it("sostituisce le variabili presenti nella mappa", () => {
    expect(sostituisciVariabili("Ciao {{nome}} {{cognome}}!", { nome: "Giulia", cognome: "Verdi" })).toBe(
      "Ciao Giulia Verdi!"
    );
  });

  it("sostituisce con stringa vuota le variabili mancanti", () => {
    expect(sostituisciVariabili("Corso: {{corso}}", {})).toBe("Corso: ");
  });

  it("gestisce spazi dentro le doppie graffe", () => {
    expect(sostituisciVariabili("Ciao {{ nome }}", { nome: "Marco" })).toBe("Ciao Marco");
  });

  it("lascia invariato un testo senza variabili", () => {
    expect(sostituisciVariabili("Nessuna variabile qui.", { nome: "x" })).toBe("Nessuna variabile qui.");
  });

  it("sostituisce più occorrenze della stessa variabile", () => {
    expect(sostituisciVariabili("{{nome}}, {{nome}}!", { nome: "Anna" })).toBe("Anna, Anna!");
  });
});
