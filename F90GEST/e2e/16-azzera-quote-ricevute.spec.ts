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

test("flusso critico: azzera quote e ricevute lasciando i soci registrati", async ({ page }) => {
  await accedi(page);

  // 1. Crea una persona, un conto, un tipo di quota, una quota pagata con ricevuta
  await page.goto("/soci/nuovo");
  await page.getByLabel("Nome *", { exact: true }).fill("Anna");
  await page.getByLabel("Cognome *", { exact: true }).fill("Costa");
  await page.getByLabel("Codice fiscale *").fill("CSTNNA82T41H501Z");
  await page.getByRole("button", { name: "Crea persona" }).click();
  await page.waitForURL(/\/soci\/(?!nuovo)[^/]+$/);

  await page.goto("/contabilita");
  await page.getByRole("tab", { name: "Conti" }).click();
  await page.getByRole("button", { name: "Nuovo conto" }).click();
  await page.getByLabel("Nome").fill("Cassa azzeramento quote");
  await page.getByLabel("Saldo iniziale").fill("0");
  await page.getByRole("button", { name: "Crea", exact: true }).click();

  await page.getByRole("tab", { name: "Tipi di quota" }).click();
  await page.getByRole("button", { name: "Nuovo tipo di quota" }).click();
  await page.getByLabel("Descrizione").fill("Quota errata");
  await page.getByLabel("Importo").fill("45");
  await page.getByRole("button", { name: "Crea", exact: true }).click();

  await page.goto("/soci");
  await page.getByRole("link", { name: "Costa Anna" }).click();
  await page.getByRole("button", { name: "Genera quota" }).click();
  await page.getByRole("button", { name: "Genera", exact: true }).click();
  await page.getByRole("button", { name: "Registra pagamento" }).click();
  await page.getByRole("button", { name: "Registra e genera ricevuta" }).click();
  await expect(page.getByText("pagata")).toBeVisible();

  // 2. Azzera quote e ricevute
  await page.goto("/contabilita");
  await page.getByRole("tab", { name: "Ricevute" }).click();
  await expect(page.getByText("Costa Anna")).toBeVisible();

  await page.getByRole("button", { name: "Azzera quote e ricevute" }).click();
  await page.getByLabel(/Digita ELIMINA/).fill("ELIMINA");
  await page.getByRole("button", { name: "Conferma" }).click();
  await expect(page.getByText(/Eliminate \d+ quote/)).toBeVisible();

  // 3. Nessuna ricevuta rimasta
  await expect(page.getByText("Nessuna ricevuta emessa.")).toBeVisible();

  // 4. La persona resta registrata
  await page.goto("/soci");
  await expect(page.getByRole("link", { name: "Costa Anna" })).toBeVisible();

  // 5. La sua scheda non mostra più la quota pagata
  await page.getByRole("link", { name: "Costa Anna" }).click();
  await expect(page.getByText("Quota errata")).not.toBeVisible();
});
