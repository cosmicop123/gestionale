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

test("flusso critico: consiglio direttivo, verbale di ammissione precompilato e Compilatore", async ({ page }) => {
  await accedi(page);

  // 1. Nomina Giulia Verdi (già censita da 03-contabilita) Presidente da Amministrazione -> Consiglio direttivo
  await page.goto("/amministrazione");
  await page.getByRole("tab", { name: "Consiglio direttivo" }).click();
  await page.getByRole("button", { name: "Nomina presidente" }).click();
  await page.getByLabel("Persona").click();
  await page.getByRole("option", { name: "Verdi Giulia" }).click();
  await page.getByRole("button", { name: "Nomina", exact: true }).click();
  await expect(page.getByText("Carica assegnata.")).toBeVisible();

  // Ricarica la pagina invece di controllare subito sulla stessa schermata: il dialog appena
  // chiuso resta montato per la durata dell'animazione di uscita (§ note di continuità M8), con
  // il suo <select> nativo nascosto che duplicherebbe il match di "Verdi Giulia" in strict mode.
  await page.reload();
  await page.getByRole("tab", { name: "Consiglio direttivo" }).click();
  // "Verdi Giulia" compare sia nella composizione attuale sia nello storico sottostante: .first() prende la prima.
  await expect(page.getByText("Verdi Giulia").first()).toBeVisible();
  await expect(page.getByRole("button", { name: "Termina mandato" })).toBeVisible();

  // 2. Il verbale di proposta ammissione (Soci) è precompilato con la firma del Presidente appena nominato
  await page.goto("/soci");
  await page.getByRole("link", { name: "Verbale ammissione" }).click();
  await page.waitForURL("**/soci/verbale-ammissione");
  await expect(page.getByText(/Presidente: Verdi Giulia/)).toBeVisible();

  // 3. Resta un testo modificabile come qualunque comunicazione del Compilatore: si può salvare in archivio
  await page.getByRole("button", { name: "Salva in archivio" }).click();
  await expect(page.getByText("Documento salvato nell'archivio.")).toBeVisible();
  await page.waitForURL("**/documenti");
  await expect(
    page.getByRole("cell", { name: "Proposta di ammissione nuovi soci al Consiglio Direttivo" }).first()
  ).toBeVisible();

  // 4. Compilatore generico: scrivere un testo formattato e salvarlo come documento
  await page.goto("/compilatore");
  await page.getByLabel("Titolo del documento").fill("Avviso soci - chiusura estiva");
  const editabile = page.locator('[contenteditable="true"]');
  await editabile.click();
  await page.keyboard.type("La sede resterà chiusa dal 1 al 15 agosto.");
  await page.getByRole("button", { name: "Grassetto" }).click();
  await page.keyboard.type(" Grazie per la comprensione.");
  await page.getByRole("button", { name: "Salva in archivio" }).click();
  await expect(page.getByText("Documento salvato nell'archivio.")).toBeVisible();

  await page.goto("/documenti");
  await expect(page.getByRole("cell", { name: "Avviso soci - chiusura estiva" }).first()).toBeVisible();
});
