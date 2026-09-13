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

test("flusso critico: comunicazione a selezione personalizzata", async ({ page }) => {
  await accedi(page);

  // 1. Crea una persona con email (nessun altro test crea persone con email)
  await page.goto("/soci/nuovo");
  await page.getByLabel("Nome *", { exact: true }).fill("Marco");
  await page.getByLabel("Cognome *", { exact: true }).fill("Bianchi");
  await page.getByLabel("Codice fiscale *").fill("BNCMRC88E12H501Y");
  await page.getByLabel("Data di nascita").fill("1988-05-12");
  await page.getByLabel("Email", { exact: true }).fill("marco.bianchi@example.org");
  await page.getByRole("button", { name: "Crea persona" }).click();
  await page.waitForURL(/\/soci\/[^/]+$/);

  // 2. Crea una comunicazione personalizzata rivolta a questa persona
  await page.goto("/comunicazioni/nuova");
  await page.getByLabel("Titolo (uso interno)").fill("Prova comunicazione");
  await page.getByLabel("Destinatari").click();
  await page.getByRole("option", { name: "Selezione personalizzata" }).click();
  await page.getByRole("checkbox", { name: "Bianchi Marco" }).click();
  await page.getByLabel("Oggetto dell'email").fill("Ciao {{nome}}");
  await page.getByLabel("Testo dell'email").fill("Gentile {{nome}} {{cognome}}, questo è un messaggio di prova.");
  await page.getByRole("button", { name: "Crea comunicazione" }).click();
  await page.waitForURL(/\/comunicazioni\/(?!nuova)[^/]+$/);
  await expect(page.getByText("Bozza", { exact: true })).toBeVisible();

  // 3. Invia: anche senza SMTP configurato in ambiente di test, deve
  // registrare una riga di invio per il destinatario selezionato
  await page.getByRole("button", { name: "Invia ora" }).click();
  await expect(page.getByRole("cell", { name: "Bianchi Marco" })).toBeVisible();
  await expect(page.getByText("marco.bianchi@example.org")).toBeVisible();
});

test("flusso critico: privacy - registro trattamenti, richiesta interessato, revoca consenso", async ({ page }) => {
  await accedi(page);

  await page.goto("/privacy");

  // 1. Registro dei trattamenti
  await page.getByRole("button", { name: "Nuovo trattamento" }).click();
  await page.getByLabel("Nome del trattamento").fill("Gestione soci e tesseramenti");
  await page.getByLabel("Finalità").fill("Gestire il rapporto associativo e l'emissione delle tessere.");
  await page.getByLabel("Base giuridica").fill("Esecuzione del rapporto associativo (art. 6.1.b GDPR)");
  await page.getByLabel("Categorie di dati trattati").fill("Dati anagrafici e di contatto");
  await page.getByLabel("Categorie di interessati").fill("Soci");
  await page.getByLabel("Tempi di conservazione").fill("Durata del rapporto associativo + 10 anni");
  await page.getByLabel("Misure di sicurezza adottate").fill("Accesso riservato agli utenti autorizzati, backup periodici.");
  await page.getByRole("button", { name: "Salva" }).click();
  await expect(page.getByRole("cell", { name: "Gestione soci e tesseramenti" })).toBeVisible();

  // 2. Richiesta dell'interessato di tipo accesso, con esportazione dati
  await page.getByRole("tab", { name: "Richieste dell'interessato" }).click();
  await page.getByRole("button", { name: "Nuova richiesta" }).click();
  await page.getByLabel("Persona").click();
  await page.getByRole("option", { name: "Bianchi Marco" }).click();
  await page.getByRole("button", { name: "Registra" }).click();
  await expect(page.getByRole("cell", { name: "Bianchi Marco" })).toBeVisible();

  await page.getByRole("button", { name: "Genera esportazione" }).click();
  const hrefEsportazione = await page.getByRole("link", { name: "Scarica dati" }).getAttribute("href");
  const rispostaEsportazione = await page.request.get(hrefEsportazione!);
  expect(rispostaEsportazione.status()).toBe(200);
  expect(rispostaEsportazione.headers()["content-type"]).toBe("application/json");

  await page.getByRole("button", { name: "Registra esito" }).click();
  await page.getByLabel("Descrizione dell'esito").fill("Esportazione dati generata e consegnata all'interessato.");
  await page.getByRole("button", { name: "Salva esito" }).click();
  await expect(page.getByText("Evasa")).toBeVisible();

  // 3. Consensi: Paolo Neri (creato in 05-iscrizione-pubblica) ha concesso
  // il consenso al trattamento dati; lo revochiamo da qui
  await page.getByRole("tab", { name: "Consensi" }).click();
  await page.getByLabel("Persona").click();
  await page.getByRole("option", { name: "Neri Paolo" }).click();
  const rigaConsenso = page.getByRole("row", { name: /Trattamento dati per finalità associative/ });
  await expect(rigaConsenso.getByText("concesso")).toBeVisible();
  await rigaConsenso.getByRole("button", { name: "Revoca" }).click();
  await page.getByRole("button", { name: "Conferma revoca" }).click();
  await expect(page.getByRole("row", { name: /Trattamento dati per finalità associative/ }).getByText("revocato")).toBeVisible();
});
