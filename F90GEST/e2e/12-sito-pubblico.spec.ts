import { test, expect } from "@playwright/test";

const EMAIL_ADMIN = "admin@example.org";
const PASSWORD_ADMIN = "CambiaSubito!2026";

async function accedi(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(EMAIL_ADMIN);
  await page.getByLabel("Password").fill(PASSWORD_ADMIN);
  await page.getByRole("button", { name: "Accedi" }).click();
  await page.waitForURL(/\/(onboarding|dashboard)$/);
}

test("flusso critico: configurazione e generazione del sito pubblico", async ({ page }) => {
  await accedi(page);

  await page.goto("/amministrazione");
  await page.getByRole("tab", { name: "Sito pubblico" }).click();

  // 1. Configura presentazione e URL base
  await page.getByLabel("Presentazione dell'associazione (facoltativa)").fill(
    "Frequenze 90 promuove la musica e la cultura a San Donaci dal 1990."
  );
  await page.getByLabel("URL pubblico del gestionale (facoltativo)").fill("https://gestionale.frequenze90.it");
  await page.getByRole("button", { name: "Salva" }).click();
  await expect(page.getByText("Configurazione del sito pubblico salvata.")).toBeVisible();

  // 2. Anteprima di ciascun template: HTML valido con i contenuti configurati
  for (const template of ["classico", "moderno", "vivace"]) {
    const rispostaAnteprima = await page.request.get(`/amministrazione/sito-pubblico/anteprima?template=${template}`);
    expect(rispostaAnteprima.status()).toBe(200);
    expect(rispostaAnteprima.headers()["content-type"]).toContain("text/html");
    const corpo = await rispostaAnteprima.text();
    expect(corpo).toContain("Frequenze 90 promuove la musica");
    expect(corpo).toContain("Corsi disponibili");
  }

  // 3. Download come ZIP
  const hrefScarica = await page
    .getByRole("link", { name: "Scarica sito" })
    .first()
    .getAttribute("href");
  const rispostaScarica = await page.request.get(hrefScarica!);
  expect(rispostaScarica.status()).toBe(200);
  expect(rispostaScarica.headers()["content-type"]).toBe("application/zip");

  // 4. Un template non valido viene rifiutato
  const rispostaNonValida = await page.request.get("/amministrazione/sito-pubblico/anteprima?template=inesistente");
  expect(rispostaNonValida.status()).toBe(400);
});
