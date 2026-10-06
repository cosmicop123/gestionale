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

test("flusso critico: modello di documento con parti variabili", async ({ page }) => {
  await accedi(page);

  await page.goto("/documenti");
  await page.getByRole("tab", { name: "Modelli di documento" }).click();

  // 1. Crea un modello con due segnaposto
  await page.getByRole("button", { name: "Nuovo modello" }).click();
  await page.getByLabel("Nome del modello").fill("Lettera di convocazione");
  await page
    .getByLabel("Testo del documento")
    .fill("Gentile {{nome_destinatario}},\n\nla convochiamo per il giorno {{data_assemblea}}.");
  await page.getByRole("button", { name: "Salva" }).click();
  await expect(page.getByRole("cell", { name: "Lettera di convocazione" })).toBeVisible();
  await expect(page.getByText("nome_destinatario")).toBeVisible();
  await expect(page.getByText("data_assemblea")).toBeVisible();

  // 2. Genera un documento compilando le parti variabili e salvalo in archivio
  await page.getByRole("button", { name: "Genera documento" }).click();
  await page.getByLabel("nome_destinatario").fill("Giulia Verdi");
  await page.getByLabel("data_assemblea").fill("15 novembre 2026");
  await page.getByRole("button", { name: "Genera e salva in archivio" }).click();
  await expect(page.getByText("Documento generato e salvato nell'archivio.")).toBeVisible();

  // 3. Il documento generato compare nell'archivio documenti
  await page.getByRole("tab", { name: "Documenti", exact: true }).click();
  await expect(page.getByRole("cell", { name: "Lettera di convocazione" }).first()).toBeVisible();
});
