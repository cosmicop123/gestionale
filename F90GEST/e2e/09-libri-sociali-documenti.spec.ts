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

test("flusso critico: riunione con delibera e verbale", async ({ page }) => {
  await accedi(page);

  await page.goto("/libri-sociali/riunioni/nuova");
  await page.getByLabel("Ordine del giorno").fill("Approvazione del rendiconto annuale");
  await page.getByRole("button", { name: "Crea riunione" }).click();
  await page.waitForURL(/\/libri-sociali\/riunioni\/(?!nuova)[^/]+$/);

  await page.getByRole("button", { name: "Aggiungi convocato" }).click();
  await page.getByLabel("Persona").click();
  await page.getByRole("option", { name: "Verdi Giulia" }).click();
  await page.getByRole("button", { name: "Aggiungi" }).click();
  await expect(page.getByRole("row", { name: /Verdi Giulia/ })).toBeVisible();

  const checkboxPresenza = page.getByRole("row", { name: /Verdi Giulia/ }).getByRole("checkbox");
  await checkboxPresenza.click();
  await expect(checkboxPresenza).toBeChecked();

  const checkboxQuorum = page.getByLabel(/Quorum costitutivo verificato/);
  await checkboxQuorum.click();
  await expect(checkboxQuorum).toBeChecked();

  await page.getByRole("tab", { name: "Delibere" }).click();
  await page.getByRole("button", { name: "Nuova delibera" }).click();
  await page.getByLabel("Oggetto").fill("Approvazione del rendiconto per cassa 2026/2027");
  await page.getByRole("button", { name: "Aggiungi", exact: true }).click();
  await expect(page.getByText("Approvazione del rendiconto per cassa")).toBeVisible();
  await expect(page.getByText("Approvata", { exact: true }).first()).toBeVisible();

  await page.getByRole("tab", { name: "Verbale" }).click();
  await page.getByLabel("Testo del verbale").fill("Il presidente apre la seduta alle ore 18:00...");
  await page.getByRole("button", { name: "Salva verbale" }).click();
  await expect(page.getByText("Verbale salvato.")).toBeVisible();

  const hrefPdf = await page.getByRole("link", { name: "Verbale PDF" }).getAttribute("href");
  const rispostaPdf = await page.request.get(hrefPdf!);
  expect(rispostaPdf.status()).toBe(200);
  expect(rispostaPdf.headers()["content-type"]).toBe("application/pdf");
});

test("flusso critico: archivio documenti e protocollo", async ({ page }) => {
  await accedi(page);

  await page.goto("/documenti");
  await page.getByRole("button", { name: "Carica documento" }).click();
  await page.getByLabel("Titolo").fill("Statuto sociale");
  await page.locator("#file").setInputFiles({
    name: "statuto.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from("%PDF-1.4 contenuto di prova"),
  });
  await page.getByRole("button", { name: "Carica", exact: true }).click();
  await expect(page.getByRole("cell", { name: "Statuto sociale" })).toBeVisible();
  await expect(page.getByText("v1")).toBeVisible();

  await page.getByRole("tab", { name: "Protocollo" }).click();
  await page.getByRole("button", { name: "Nuovo protocollo" }).click();
  await page.getByLabel("Mittente / destinatario").fill("Comune di San Donaci");
  await page.getByLabel("Oggetto").fill("Richiesta patrocinio evento");
  await page.locator("#allegato").setInputFiles({
    name: "richiesta.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from("%PDF-1.4 richiesta di prova"),
  });
  await page.getByRole("button", { name: "Registra", exact: true }).click();
  await expect(page.getByRole("cell", { name: "Comune di San Donaci" })).toBeVisible();
  await expect(page.getByText(/^1\/\d{4}$/)).toBeVisible();
});
