import { test, expect } from "@playwright/test";

// Flusso critico M0: la pagina di login è raggiungibile e mostra il form.
// L'autenticazione vera e propria verrà coperta da un flusso E2E dedicato
// nella milestone M1, quando esisterà una sessione reale da verificare.
test("la pagina di login mostra il form di accesso", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: "F90GEST" })).toBeVisible();
  await expect(page.getByLabel("Email")).toBeVisible();
  await expect(page.getByLabel("Password")).toBeVisible();
  await expect(page.getByRole("button", { name: "Accedi" })).toBeVisible();
});
