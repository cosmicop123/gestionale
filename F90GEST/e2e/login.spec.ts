import { test, expect } from "@playwright/test";

// Credenziali create dal seed (prisma/seed.ts): stabili perché il database
// di test viene ricreato da zero ad ogni run (vedi global-setup.ts).
const EMAIL_ADMIN = "admin@example.org";
const PASSWORD_ADMIN = "CambiaSubito!2026";

test("la pagina di login mostra il form di accesso", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: "F90GEST" })).toBeVisible();
  await expect(page.getByLabel("Email")).toBeVisible();
  await expect(page.getByLabel("Password")).toBeVisible();
  await expect(page.getByRole("button", { name: "Accedi" })).toBeVisible();
});

test("un utente senza sessione viene rimandato al login se prova ad accedere alla dashboard", async ({
  page,
}) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login$/);
});

test("flusso critico: accesso amministratore, wizard di primo avvio, navigazione, uscita", async ({
  page,
}) => {
  // 1. Login con le credenziali seedate
  await page.goto("/login");
  await page.getByLabel("Email").fill(EMAIL_ADMIN);
  await page.getByLabel("Password").fill(PASSWORD_ADMIN);
  await page.getByRole("button", { name: "Accedi" }).click();

  // 2. Al primo accesso, l'associazione non è ancora configurata: wizard di onboarding
  await expect(page).toHaveURL(/\/onboarding$/);
  await expect(page.getByRole("heading", { name: "Benvenuto in F90GEST" })).toBeVisible();

  await page.getByLabel("Denominazione *").fill("Associazione Culturale Frequenze 90");
  await page.getByLabel("Codice fiscale *").fill("12345678901");
  await page.getByLabel("Indirizzo *").fill("Via Roma 1");
  await page.getByLabel("CAP *").fill("72025");
  await page.getByLabel("Comune *").fill("San Donaci");
  await page.getByLabel("Provincia *").fill("BR");
  await page.getByRole("button", { name: "Completa la configurazione" }).click();

  // 3. Dopo il wizard si arriva alla dashboard con i dati dell'ente
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(
    page.getByRole("heading", { name: "Associazione Culturale Frequenze 90" })
  ).toBeVisible();

  // 4. La sezione Amministrazione è raggiungibile e mostra le tab previste
  await page.getByRole("link", { name: "Amministrazione" }).click();
  await expect(page).toHaveURL(/\/amministrazione$/);
  await expect(page.getByRole("tab", { name: "Dati ente" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "Anni sociali" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "Utenti" })).toBeVisible();

  // 5. Uscita: si torna al login e la dashboard non è più raggiungibile
  await page.getByRole("button", { name: `Menu utente: ${EMAIL_ADMIN}` }).click();
  await page.getByRole("menuitem", { name: "Esci" }).click();
  await expect(page).toHaveURL(/\/login$/);

  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login$/);
});
