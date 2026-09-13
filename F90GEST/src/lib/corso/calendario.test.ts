import { describe, expect, it } from "vitest";
import { generaCalendarioLezioni } from "./calendario";

describe("generaCalendarioLezioni", () => {
  it("genera lezioni settimanali nel giorno indicato", () => {
    // Martedì 1 settembre 2026 è di martedì.
    const date = generaCalendarioLezioni({
      dataInizio: new Date(2026, 8, 1),
      numeroLezioni: 3,
      giorniSettimana: [2], // martedì
    });
    expect(date).toHaveLength(3);
    expect(date.every((d) => d.getDay() === 2)).toBe(true);
    expect(date[0]).toEqual(new Date(2026, 8, 1));
    expect(date[1]).toEqual(new Date(2026, 8, 8));
    expect(date[2]).toEqual(new Date(2026, 8, 15));
  });

  it("include la data di inizio se cade già nel giorno della cadenza", () => {
    const date = generaCalendarioLezioni({
      dataInizio: new Date(2026, 8, 1), // martedì
      numeroLezioni: 1,
      giorniSettimana: [2],
    });
    expect(date[0]).toEqual(new Date(2026, 8, 1));
  });

  it("salta al primo giorno utile se la data di inizio non è nella cadenza", () => {
    const date = generaCalendarioLezioni({
      dataInizio: new Date(2026, 8, 2), // mercoledì
      numeroLezioni: 1,
      giorniSettimana: [2], // martedì
    });
    expect(date[0]).toEqual(new Date(2026, 8, 8));
  });

  it("gestisce più giorni della settimana nella stessa cadenza", () => {
    const date = generaCalendarioLezioni({
      dataInizio: new Date(2026, 8, 1), // martedì
      numeroLezioni: 4,
      giorniSettimana: [2, 4], // martedì e giovedì
    });
    expect(date.map((d) => d.getDay())).toEqual([2, 4, 2, 4]);
  });

  it("esclude le date di festività", () => {
    const date = generaCalendarioLezioni({
      dataInizio: new Date(2026, 8, 1),
      numeroLezioni: 2,
      giorniSettimana: [2],
      festivita: [new Date(2026, 8, 8)], // salta la seconda martedì
    });
    expect(date[0]).toEqual(new Date(2026, 8, 1));
    expect(date[1]).toEqual(new Date(2026, 8, 15));
  });

  it("rifiuta un numero di lezioni non positivo", () => {
    expect(() =>
      generaCalendarioLezioni({ dataInizio: new Date(), numeroLezioni: 0, giorniSettimana: [1] })
    ).toThrow();
  });

  it("rifiuta una cadenza senza giorni della settimana", () => {
    expect(() =>
      generaCalendarioLezioni({ dataInizio: new Date(), numeroLezioni: 1, giorniSettimana: [] })
    ).toThrow();
  });
});
