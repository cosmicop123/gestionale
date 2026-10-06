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

test("flusso critico: correzione della numerazione ricevute per ricevute già emesse fuori dal gestionale", async ({
  page,
}) => {
  await accedi(page);

  // 1. Crea una persona, un conto, un tipo di quota e una prima ricevuta
  //    (indipendenti dagli altri test: non presuppone un ordine di esecuzione)
  await page.goto("/soci/nuovo");
  await page.getByLabel("Nome *", { exact: true }).fill("Luca");
  await page.getByLabel("Cognome *", { exact: true }).fill("Neri");
  await page.getByLabel("Codice fiscale *").fill("NERLCU85M20H501D");
  await page.getByRole("button", { name: "Crea persona" }).click();
  await page.waitForURL(/\/soci\/(?!nuovo)[^/]+$/);

  await page.goto("/contabilita");
  await page.getByRole("tab", { name: "Conti" }).click();
  await page.getByRole("button", { name: "Nuovo conto" }).click();
  await page.getByLabel("Nome").fill("Cassa correzione numerazione");
  await page.getByLabel("Saldo iniziale").fill("0");
  await page.getByRole("button", { name: "Crea", exact: true }).click();

  await page.getByRole("tab", { name: "Tipi di quota" }).click();
  await page.getByRole("button", { name: "Nuovo tipo di quota" }).click();
  await page.getByLabel("Descrizione").fill("Quota correzione numerazione");
  await page.getByLabel("Importo").fill("10");
  await page.getByRole("button", { name: "Crea", exact: true }).click();

  await page.goto("/soci");
  await page.getByRole("link", { name: "Neri Luca" }).click();
  await page.getByRole("button", { name: "Genera quota" }).click();
  await page.getByRole("button", { name: "Genera", exact: true }).click();
  await page.getByRole("button", { name: "Registra pagamento" }).click();
  await page.getByRole("button", { name: "Registra e genera ricevuta" }).click();

  // 2. Corregge la numerazione: tutte le ricevute 2026 vengono annullate e
  //    la prossima avrà il numero 500 (ben sopra qualunque numero già usato
  //    dagli altri test di questa suite)
  const annoCorrente = new Date().getFullYear();
  await page.goto("/contabilita");
  await page.getByRole("tab", { name: "Ricevute" }).click();
  const righePrimaCorrezione = await page.getByRole("row").count();
  expect(righePrimaCorrezione).toBeGreaterThan(1);

  await page.getByRole("button", { name: "Correggi numerazione" }).click();
  await page.getByLabel("Anno solare").fill(String(annoCorrente));
  await page.getByLabel("Prossimo numero da assegnare").fill("500");
  await page.getByLabel(/Digita AZZERA/).fill("AZZERA");
  await page.getByRole("button", { name: "Conferma" }).click();
  await expect(page.getByText(/ricevuta emessa per il \d{4} avrà il numero 500/)).toBeVisible();

  // 3. Tutte le ricevute precedenti risultano "annullata"
  await expect(page.getByText("annullata").first()).toBeVisible();

  // 4. Una nuova ricevuta emessa ora riparte dal numero 500 (nuovo tipo di
  //    quota: quello già usato sopra non offre più "Genera quota" per
  //    questa persona, essendo già stato generato e pagato)
  await page.goto("/contabilita");
  await page.getByRole("tab", { name: "Tipi di quota" }).click();
  await page.getByRole("button", { name: "Nuovo tipo di quota" }).click();
  await page.getByLabel("Descrizione").fill("Quota correzione numerazione 2");
  await page.getByLabel("Importo").fill("10");
  await page.getByRole("button", { name: "Crea", exact: true }).click();

  await page.goto("/soci");
  await page.getByRole("link", { name: "Neri Luca" }).click();
  await page.getByRole("button", { name: "Genera quota" }).click();
  await page.getByLabel("Tipo di quota").click();
  await page.getByRole("option", { name: "Quota correzione numerazione 2" }).click();
  await page.getByRole("button", { name: "Genera", exact: true }).click();
  await page.getByRole("button", { name: "Registra pagamento" }).click();
  await page.getByRole("button", { name: "Registra e genera ricevuta" }).click();

  await page.goto("/contabilita");
  await page.getByRole("tab", { name: "Ricevute" }).click();
  await expect(page.getByRole("cell", { name: `500/${annoCorrente}` })).toBeVisible();
});
