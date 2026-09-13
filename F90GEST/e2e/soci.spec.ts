import { test, expect } from "@playwright/test";

const EMAIL_ADMIN = "admin@example.org";
const PASSWORD_ADMIN = "CambiaSubito!2026";

async function accedi(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(EMAIL_ADMIN);
  await page.getByLabel("Password").fill(PASSWORD_ADMIN);
  await page.getByRole("button", { name: "Accedi" }).click();
  await page.waitForURL(/\/(onboarding|dashboard)$/);
  if (page.url().includes("/onboarding")) {
    await page.getByLabel("Denominazione *").fill("Associazione Culturale Frequenze 90");
    await page.getByLabel("Codice fiscale *").fill("12345678901");
    await page.getByLabel("Indirizzo *").fill("Via Roma 1");
    await page.getByLabel("CAP *").fill("72025");
    await page.getByLabel("Comune *").fill("San Donaci");
    await page.getByLabel("Provincia *").fill("BR");
    await page.getByRole("button", { name: "Completa la configurazione" }).click();
    await page.waitForURL("**/dashboard");
  }
}

test("flusso critico: anagrafica persona, ammissione a socio, tessera, libro soci", async ({ page }) => {
  await accedi(page);

  // 1. Crea una nuova persona con codice fiscale valido (checksum verificato in codice-fiscale.test.ts)
  await page.goto("/soci/nuovo");
  await page.getByLabel("Nome *", { exact: true }).fill("Mario");
  await page.getByLabel("Cognome *", { exact: true }).fill("Rossi");
  await page.getByLabel("Codice fiscale *").fill("RSSMRA85M01H501Q");
  await page.getByLabel("Data di nascita").fill("1985-08-01");
  await page.getByRole("button", { name: "Crea persona" }).click();
  await page.waitForURL(/\/soci\/[^/]+$/);
  await expect(page.getByRole("heading", { name: "Rossi Mario" })).toBeVisible();
  await expect(page.getByText("Nessuna domanda")).toBeVisible();

  // 2. Avvia la domanda di ammissione
  await page.getByRole("button", { name: "Avvia domanda di ammissione" }).click();
  await page.getByRole("button", { name: "Registra domanda" }).click();
  await expect(page.getByText("in valutazione", { exact: true })).toBeVisible();

  // 3. Approva: assegna il numero di libro soci e crea il Socio
  await page.getByRole("button", { name: "Approva (delibera direttivo)" }).click();
  await page.getByRole("button", { name: "Conferma approvazione" }).click();
  await expect(page.getByText("N. libro soci 1")).toBeVisible();
  await expect(page.getByText("Socio · in attesa")).toBeVisible();

  // 4. Emette una tessera per l'anno sociale corrente
  await page.getByRole("button", { name: "Emetti tessera" }).click();
  await page.getByRole("button", { name: "Emetti", exact: true }).click();
  await expect(page.getByText(/^\d{4}\/\d{4}\/\d{4}$/)).toBeVisible();

  // 5. Il socio compare nel libro soci alla data odierna
  await page.goto("/soci/libro-soci");
  await expect(page.getByRole("cell", { name: "Rossi Mario" })).toBeVisible();
});
