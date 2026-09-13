import { test, expect } from "@playwright/test";

const EMAIL_ADMIN = "admin@example.org";
const PASSWORD_ADMIN = "CambiaSubito!2026";

const GIORNI_SETTIMANA_ETICHETTE = ["Domenica", "Lunedì", "Martedì", "Mercoledì", "Giovedì", "Venerdì", "Sabato"];

async function accedi(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(EMAIL_ADMIN);
  await page.getByLabel("Password").fill(PASSWORD_ADMIN);
  await page.getByRole("button", { name: "Accedi" }).click();
  await page.waitForURL(/\/(onboarding|dashboard)$/);
}

// Riusa la persona "Giulia Verdi" creata e ammessa a socia nel test
// precedente (03-contabilita.spec.ts): i test e2e condividono un solo
// database per l'intera run (vedi CLAUDE.md), quindi qui esiste già.
test("flusso critico: corso con calendario automatico, iscrizione, appello e attestato", async ({ page }) => {
  await accedi(page);

  const oggi = new Date();
  const giornoSettimanaOggi = GIORNI_SETTIMANA_ETICHETTE[oggi.getDay()];
  const dataOggiInput = oggi.toISOString().slice(0, 10);

  // 1. Crea un corso con calendario generato automaticamente (1 lezione, oggi)
  await page.goto("/corsi/nuovo");
  await page.getByLabel("Titolo del corso").fill("Laboratorio di ceramica");
  await page.getByLabel("Data di inizio").fill(dataOggiInput);
  await page.getByLabel("Genera automaticamente il calendario delle lezioni").check();
  await page.getByLabel("Numero di lezioni").fill("1");
  await page.getByLabel("Durata di ogni lezione (ore)").fill("2");
  await page.getByLabel("Ora inizio").fill("18:00");
  await page.getByLabel("Ora fine").fill("20:00");
  await page.getByText(giornoSettimanaOggi, { exact: true }).click();
  await page.getByRole("button", { name: "Crea corso" }).click();
  await page.waitForURL(/\/corsi\/(?!nuovo)[^/]+$/);

  await page.getByRole("tab", { name: "Lezioni" }).click();
  await expect(page.getByRole("cell", { name: "1", exact: true })).toBeVisible();

  // 2. Iscrive Giulia Verdi al corso
  await page.getByRole("tab", { name: "Iscrizioni" }).click();
  await page.getByRole("button", { name: "Nuova iscrizione" }).click();
  await page.getByLabel("Persona").click();
  await page.getByRole("option", { name: "Verdi Giulia" }).click();
  await page.getByRole("button", { name: "Iscrivi" }).click();
  await expect(page.getByText("Confermato", { exact: true })).toBeVisible();

  // 3. Segna la lezione come svolta e fa l'appello (presente)
  await page.getByRole("tab", { name: "Lezioni" }).click();
  const rigaLezione = page.getByRole("row").filter({ hasText: "18:00" });
  await rigaLezione.getByRole("combobox").click();
  await page.getByRole("option", { name: "Svolta" }).click();

  await page.getByRole("link", { name: "Appello" }).click();
  await page.waitForURL(/\/appello$/);
  await expect(page.getByText("Verdi Giulia")).toBeVisible();
  await page.getByRole("button", { name: "Presente", exact: true }).click();

  // 4. Il registro presenze in PDF è scaricabile
  const paginaCorso = page.url().split("/lezioni/")[0];
  const lezioneId = page.url().split("/lezioni/")[1].split("/")[0];
  const rispostaRegistro = await page.request.get(`${paginaCorso}/lezioni/${lezioneId}/registro/pdf`);
  expect(rispostaRegistro.status()).toBe(200);
  expect(rispostaRegistro.headers()["content-type"]).toBe("application/pdf");

  // 5. Genera gli attestati: idoneo con il 100% di presenza sull'unica lezione svolta
  await page.goto(paginaCorso);
  await page.getByRole("tab", { name: "Attestati" }).click();
  await expect(page.getByText("100%")).toBeVisible();
  await page.getByRole("button", { name: /Genera attestati mancanti/ }).click();
  await expect(page.getByText(/n\. 1/)).toBeVisible();
});
