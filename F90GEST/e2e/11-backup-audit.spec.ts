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

test("flusso critico: backup scaricabile e registro di controllo", async ({ page }) => {
  await accedi(page);

  // 1. Il backup si scarica come un unico ZIP con database e allegati
  await page.goto("/amministrazione");
  await page.getByRole("tab", { name: "Backup e ripristino" }).click();
  const hrefBackup = await page.getByRole("link", { name: "Scarica backup" }).getAttribute("href");
  const rispostaBackup = await page.request.get(hrefBackup!);
  expect(rispostaBackup.status()).toBe(200);
  expect(rispostaBackup.headers()["content-type"]).toBe("application/zip");

  // 2. Il download compare nel registro di controllo (append-only)
  await page.goto("/amministrazione");
  await page.getByRole("tab", { name: "Registro di controllo" }).click();
  await page.getByPlaceholder("Filtra per entità, azione o utente...").fill("backup");
  await expect(page.getByRole("cell", { name: /Backup/ }).first()).toBeVisible();
});
