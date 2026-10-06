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

// Non testiamo "Verifica connessione"/"Sincronizza" qui: eseguirebbero una
// vera connessione di rete verso un host inventato, con tempi di risposta
// non deterministici (stesso principio già seguito altrove in questa suite
// per evitare operazioni "reali" non necessarie a verificare il flusso UI).
test("flusso critico: configurazione casella email e PEC, posta in arrivo", async ({ page }) => {
  await accedi(page);

  await page.goto("/amministrazione");
  await page.getByRole("tab", { name: "Email e PEC" }).click();

  // 1. Crea una casella ordinaria
  await page.getByRole("button", { name: "Nuova casella" }).click();
  await page.getByLabel("Nome descrittivo").fill("Email istituzionale");
  await page.getByLabel("Indirizzo email").fill("info@frequenze90.example.org");
  await page.getByLabel("Host", { exact: true }).first().fill("smtp.example.org");
  await page.getByLabel("Utente", { exact: true }).first().fill("info@frequenze90.example.org");
  await page.getByLabel("Password", { exact: true }).first().fill("PasswordSmtp!2026");
  await page.getByLabel("Host", { exact: true }).last().fill("imap.example.org");
  await page.getByLabel("Utente", { exact: true }).last().fill("info@frequenze90.example.org");
  await page.getByLabel("Password", { exact: true }).last().fill("PasswordImap!2026");
  await page.getByRole("button", { name: "Salva" }).click();
  await expect(page.getByRole("cell", { name: "Email istituzionale" })).toBeVisible();
  await expect(page.getByText("info@frequenze90.example.org", { exact: true })).toBeVisible();

  // 2. Modifica la casella (solo etichetta, password lasciate vuote = invariate)
  await page.getByRole("row", { name: /Email istituzionale/ }).getByRole("button").nth(2).click();
  await page.getByLabel("Nome descrittivo").fill("Email istituzionale (aggiornata)");
  await page.getByRole("button", { name: "Salva" }).click();
  await expect(page.getByRole("cell", { name: "Email istituzionale (aggiornata)" })).toBeVisible();

  // 3. Crea anche una casella PEC
  await page.getByRole("button", { name: "Nuova casella" }).click();
  await page.getByLabel("Tipo di casella").click();
  await page.getByRole("option", { name: "PEC" }).click();
  await page.getByLabel("Nome descrittivo").fill("PEC Associazione");
  await page.getByLabel("Indirizzo email").fill("frequenze90@pec.example.org");
  await page.getByLabel("Host", { exact: true }).first().fill("smtps.pec.example.org");
  await page.getByLabel("Utente", { exact: true }).first().fill("frequenze90@pec.example.org");
  await page.getByLabel("Password", { exact: true }).first().fill("PasswordPecSmtp!2026");
  await page.getByLabel("Host", { exact: true }).last().fill("imaps.pec.example.org");
  await page.getByLabel("Utente", { exact: true }).last().fill("frequenze90@pec.example.org");
  await page.getByLabel("Password", { exact: true }).last().fill("PasswordPecImap!2026");
  await page.getByRole("button", { name: "Salva" }).click();
  await expect(page.getByRole("cell", { name: "PEC Associazione" })).toBeVisible();

  // 4. La tab "Posta in arrivo" di Comunicazioni esiste ed è vuota (nessuna
  // sincronizzazione reale eseguita in questo test)
  await page.goto("/comunicazioni");
  await page.getByRole("tab", { name: "Posta in arrivo" }).click();
  await expect(page.getByText("Nessun messaggio scaricato.")).toBeVisible();

  // 5. Elimina la casella PEC appena creata
  await page.goto("/amministrazione");
  await page.getByRole("tab", { name: "Email e PEC" }).click();
  await page.getByRole("row", { name: /PEC Associazione/ }).getByRole("button").last().click();
  await expect(page.getByRole("cell", { name: "PEC Associazione" })).not.toBeVisible();
});
