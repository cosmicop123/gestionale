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

// Riusa il conto "Cassa contanti" (saldo iniziale 100 €) e il pagamento
// della quota da 25 € registrati in 03-contabilita.spec.ts: a quel punto il
// saldo di cassa è 125 € e il movimento di 25 € è categorizzato come
// "quote_associative", che secondo la mappatura di default finisce nella
// sezione A del rendiconto.
test("flusso critico: rendiconto per cassa riflette i movimenti registrati", async ({ page }) => {
  await accedi(page);

  await page.goto("/contabilita");
  await page.getByRole("tab", { name: "Rendiconto" }).click();

  await expect(page.getByText("Cassa e banca a fine periodo")).toBeVisible();
  await expect(page.getByText("125,00 €").first()).toBeVisible();

  // Di default il rendiconto è in forma aggregata (seed): niente dettaglio
  // per categoria, solo i totali per sezione.
  await expect(page.getByText("A) Attività di interesse generale")).toBeVisible();

  // Disattiva la forma aggregata: compare il dettaglio per categoria.
  await page.getByLabel(/Rendiconto in forma aggregata/).click();
  await expect(page.getByText(/Entrate — Quote associative/)).toBeVisible();

  // Il PDF del rendiconto si genera correttamente.
  const hrefPdf = await page.getByRole("link", { name: "PDF" }).getAttribute("href");
  const rispostaPdf = await page.request.get(hrefPdf!);
  expect(rispostaPdf.status()).toBe(200);
  expect(rispostaPdf.headers()["content-type"]).toBe("application/pdf");

  // Ripristina la forma aggregata (parametro globale, non per anno sociale)
  // per non condizionare eventuali test successivi.
  await page.getByLabel(/Rendiconto in forma aggregata/).click();
});
