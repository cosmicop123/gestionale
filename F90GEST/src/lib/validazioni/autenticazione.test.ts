import { describe, expect, it } from "vitest";
import { schemaAccesso } from "./autenticazione";

describe("schemaAccesso", () => {
  it("accetta email e password valide", () => {
    const risultato = schemaAccesso.safeParse({
      email: "presidente@frequenze90.it",
      password: "unaPassword",
    });
    expect(risultato.success).toBe(true);
  });

  it("rifiuta un'email non valida", () => {
    const risultato = schemaAccesso.safeParse({
      email: "non-una-email",
      password: "unaPassword",
    });
    expect(risultato.success).toBe(false);
  });

  it("rifiuta una password vuota", () => {
    const risultato = schemaAccesso.safeParse({
      email: "presidente@frequenze90.it",
      password: "",
    });
    expect(risultato.success).toBe(false);
  });
});
