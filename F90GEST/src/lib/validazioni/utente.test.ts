import { describe, expect, it } from "vitest";
import { schemaNuovoUtente } from "./utente";

describe("schemaNuovoUtente", () => {
  it("accetta dati validi", () => {
    const risultato = schemaNuovoUtente.safeParse({
      email: "segreteria@frequenze90.it",
      ruolo: "segreteria",
      password: "unaPasswordLunga",
    });
    expect(risultato.success).toBe(true);
  });

  it("rifiuta una password troppo corta", () => {
    const risultato = schemaNuovoUtente.safeParse({
      email: "segreteria@frequenze90.it",
      ruolo: "segreteria",
      password: "corta",
    });
    expect(risultato.success).toBe(false);
  });

  it("rifiuta un ruolo non ammesso", () => {
    const risultato = schemaNuovoUtente.safeParse({
      email: "segreteria@frequenze90.it",
      ruolo: "super_admin",
      password: "unaPasswordLunga",
    });
    expect(risultato.success).toBe(false);
  });
});
