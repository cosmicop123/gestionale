import { describe, expect, it } from "vitest";
import { estraiVariabili } from "./variabili";

describe("estraiVariabili", () => {
  it("estrae i segnaposto univoci in ordine di prima comparsa", () => {
    expect(estraiVariabili("Gentile {{nome}}, la convochiamo per il {{data}}. Firmato {{nome}}.")).toEqual([
      "nome",
      "data",
    ]);
  });

  it("gestisce gli spazi dentro le doppie graffe", () => {
    expect(estraiVariabili("Ciao {{ nome }}")).toEqual(["nome"]);
  });

  it("restituisce un array vuoto senza segnaposto", () => {
    expect(estraiVariabili("Nessuna variabile qui.")).toEqual([]);
  });
});
