import { describe, expect, it } from "vitest";
import { calcolaEta, isMinorenne } from "./eta";

describe("calcolaEta", () => {
  it("calcola correttamente l'età quando il compleanno è già passato quest'anno", () => {
    expect(calcolaEta(new Date(2000, 0, 1), new Date(2026, 5, 15))).toBe(26);
  });

  it("calcola correttamente l'età quando il compleanno non è ancora arrivato quest'anno", () => {
    expect(calcolaEta(new Date(2000, 11, 31), new Date(2026, 0, 1))).toBe(25);
  });

  it("gestisce esattamente il giorno del compleanno", () => {
    expect(calcolaEta(new Date(2010, 5, 15), new Date(2026, 5, 15))).toBe(16);
  });
});

describe("isMinorenne", () => {
  it("riconosce un minorenne", () => {
    expect(isMinorenne(new Date(2015, 0, 1), new Date(2026, 0, 1))).toBe(true);
  });

  it("riconosce un maggiorenne appena diventato tale", () => {
    expect(isMinorenne(new Date(2008, 5, 15), new Date(2026, 5, 15))).toBe(false);
  });

  it("riconosce un maggiorenne il giorno prima del diciottesimo compleanno come ancora minorenne", () => {
    expect(isMinorenne(new Date(2008, 5, 15), new Date(2026, 5, 14))).toBe(true);
  });
});
