import { describe, expect, it } from "vitest";
import { costruisciBozzaVerbaleAmmissione } from "./verbale-ammissione-html";

describe("costruisciBozzaVerbaleAmmissione", () => {
  it("elenca i neo-iscritti con categoria e data della domanda", () => {
    const html = costruisciBozzaVerbaleAmmissione({
      neoIscritti: [
        { cognome: "Costa", nome: "Anna", codiceFiscale: "CSTNNA82T41H501Z", categoriaProposta: "ordinario", dataDomanda: "10/10/2026" },
      ],
      consiglioDirettivo: [],
    });
    expect(html).toContain("Costa Anna");
    expect(html).toContain("CSTNNA82T41H501Z");
    expect(html).toContain("ordinario");
    expect(html).toContain("10/10/2026");
  });

  it("segnala l'assenza di domande in attesa", () => {
    const html = costruisciBozzaVerbaleAmmissione({ neoIscritti: [], consiglioDirettivo: [] });
    expect(html).toContain("Nessuna domanda di ammissione in attesa");
  });

  it("include una riga di firma per ogni titolare del Consiglio Direttivo", () => {
    const html = costruisciBozzaVerbaleAmmissione({
      neoIscritti: [],
      consiglioDirettivo: [
        { ruolo: "Presidente", nome: "Cosimo", cognome: "Palma" },
        { ruolo: "Segretario", nome: "Antonella", cognome: "Miccoli" },
      ],
    });
    expect(html).toContain("Presidente: Palma Cosimo");
    expect(html).toContain("Segretario: Miccoli Antonella");
  });

  it("segnala quando il Consiglio Direttivo non è ancora configurato", () => {
    const html = costruisciBozzaVerbaleAmmissione({ neoIscritti: [], consiglioDirettivo: [] });
    expect(html).toContain("Composizione del Consiglio Direttivo non impostata");
  });

  it("esegue l'escape dei caratteri HTML nei dati della persona", () => {
    const html = costruisciBozzaVerbaleAmmissione({
      neoIscritti: [
        { cognome: "<script>", nome: "Mario", codiceFiscale: null, categoriaProposta: "ordinario", dataDomanda: "10/10/2026" },
      ],
      consiglioDirettivo: [],
    });
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });
});
