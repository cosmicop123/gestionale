import { describe, expect, it } from "vitest";
import type { DatiSitoPubblico } from "../dati";
import { generaHtmlClassico } from "./classico";
import { generaHtmlModerno } from "./moderno";
import { generaHtmlVivace } from "./vivace";

const DATI_BASE: DatiSitoPubblico = {
  denominazione: "Associazione Culturale Frequenze 90",
  indirizzo: "Via Roma 1, 72025 San Donaci (BR)",
  email: "info@frequenze90.it",
  telefono: "0831 000000",
  pec: "frequenze90@pec.it",
  presentazione: "Un'associazione <culturale> che promuove musica & arte.",
  generatoIl: new Date("2026-09-13T10:00:00Z"),
  corsi: [
    {
      titolo: "Corso di chitarra <base>",
      descrizione: "Corso per principianti & appassionati.",
      sede: "Sede sociale",
      dataInizio: new Date("2026-10-01"),
      dataFine: new Date("2027-05-31"),
      quotaPartecipazione: "50.00",
      linkIscrizione: "https://gestionale.frequenze90.it/iscrizione/corso-1",
    },
    {
      titolo: "Laboratorio teatrale",
      descrizione: null,
      sede: null,
      dataInizio: new Date("2026-11-01"),
      dataFine: null,
      quotaPartecipazione: null,
      linkIscrizione: null,
    },
  ],
};

const GENERATORI = [
  ["classico", generaHtmlClassico],
  ["moderno", generaHtmlModerno],
  ["vivace", generaHtmlVivace],
] as const;

describe.each(GENERATORI)("template %s", (_nome, generaHtml) => {
  it("produce un documento HTML valido con i dati dell'associazione", () => {
    const html = generaHtml(DATI_BASE);
    expect(html).toContain("<!doctype html>");
    expect(html).toContain("Associazione Culturale Frequenze 90");
    expect(html).toContain("Via Roma 1, 72025 San Donaci (BR)");
    expect(html).toContain("info@frequenze90.it");
  });

  it("escapa il contenuto proveniente dal database (titoli corso, presentazione)", () => {
    const html = generaHtml(DATI_BASE);
    expect(html).not.toContain("<culturale>");
    expect(html).not.toContain("Corso di chitarra <base>");
    expect(html).toContain("Corso di chitarra &lt;base&gt;");
    expect(html).toContain("&lt;culturale&gt;");
  });

  it("include il link di iscrizione solo quando presente", () => {
    const html = generaHtml(DATI_BASE);
    expect(html).toContain("https://gestionale.frequenze90.it/iscrizione/corso-1");
    expect(html).toContain("Laboratorio teatrale");
  });

  it("mostra un messaggio quando non ci sono corsi", () => {
    const html = generaHtml({ ...DATI_BASE, corsi: [] });
    expect(html).toContain("Nessun corso attualmente aperto alle iscrizioni.");
  });

  it("omette la sezione Chi siamo quando la presentazione è vuota", () => {
    const html = generaHtml({ ...DATI_BASE, presentazione: "" });
    expect(html).not.toContain("Chi siamo");
  });
});
