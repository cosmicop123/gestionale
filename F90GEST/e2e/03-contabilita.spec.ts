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

test("flusso critico: quota, pagamento, ricevuta automatica, attivazione socio, prima nota", async ({
  page,
}) => {
  await accedi(page);

  // 1. Crea una persona e ammettila a socio (stato iniziale: in attesa)
  await page.goto("/soci/nuovo");
  await page.getByLabel("Nome *", { exact: true }).fill("Giulia");
  await page.getByLabel("Cognome *", { exact: true }).fill("Verdi");
  await page.getByLabel("Codice fiscale *").fill("VRDGLI90A41H501U");
  await page.getByRole("button", { name: "Crea persona" }).click();
  await page.waitForURL(/\/soci\/(?!nuovo)[^/]+$/);

  await page.getByRole("button", { name: "Avvia domanda di ammissione" }).click();
  await page.getByRole("button", { name: "Registra domanda" }).click();
  await page.getByRole("button", { name: "Approva (delibera direttivo)" }).click();
  await page.getByRole("button", { name: "Conferma approvazione" }).click();
  await expect(page.getByText("Socio · in attesa")).toBeVisible();

  // 2. Crea un conto e un tipo di quota da Contabilità
  await page.goto("/contabilita");
  await page.getByRole("tab", { name: "Conti" }).click();
  await page.getByRole("button", { name: "Nuovo conto" }).click();
  await page.getByLabel("Nome").fill("Cassa contanti");
  await page.getByLabel("Saldo iniziale").fill("100");
  await page.getByRole("button", { name: "Crea", exact: true }).click();
  await expect(page.getByText("100,00 €").first()).toBeVisible();

  await page.getByRole("tab", { name: "Tipi di quota" }).click();
  await page.getByRole("button", { name: "Nuovo tipo di quota" }).click();
  await page.getByLabel("Descrizione").fill("Quota associativa");
  await page.getByLabel("Importo").fill("25");
  await page.getByRole("button", { name: "Crea", exact: true }).click();
  await expect(page.getByRole("cell", { name: "Quota associativa", exact: true }).first()).toBeVisible();

  // 3. Genera la quota per il socio e registra il pagamento
  await page.goto("/soci");
  await page.getByRole("link", { name: "Verdi Giulia" }).click();
  await page.getByRole("button", { name: "Genera quota" }).click();
  await page.getByRole("button", { name: "Genera", exact: true }).click();
  await expect(page.getByText("da_pagare")).toBeVisible();

  await page.getByRole("button", { name: "Registra pagamento" }).click();
  await page.getByRole("button", { name: "Registra e genera ricevuta" }).click();
  await expect(page.getByText("pagata")).toBeVisible();

  // 4. Il socio passa automaticamente ad attivo al pagamento della quota
  await expect(page.getByText("Socio attivo")).toBeVisible();

  // 5. Prima nota e saldo del conto riflettono il movimento generato automaticamente
  await page.goto("/contabilita");
  await expect(page.getByText("Quota Quota associativa")).toBeVisible();

  await page.getByRole("tab", { name: "Conti" }).click();
  await expect(page.getByText("125,00 €")).toBeVisible(); // saldo corrente: 100 + 25

  await page.goto("/dashboard");
  await expect(page.getByText("125,00 €")).toBeVisible();
});
