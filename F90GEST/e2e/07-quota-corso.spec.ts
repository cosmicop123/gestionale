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

// Verifica che un corso con quota di partecipazione possa generare una
// quota collegata all'iscrizione e riceverne il pagamento con ricevuta
// automatica, riusando la stessa pipeline Quota → Pagamento → Ricevuta
// delle quote associative (richiesto esplicitamente dall'utente: "rilasciare
// le ricevute per... pagamenti di corsi o altre prestazioni"). Riusa
// "Giulia Verdi", già creata e ammessa a socia in 03-contabilita.spec.ts, e
// il conto "Cassa contanti" creato nello stesso test.
test("flusso critico: quota e ricevuta per l'iscrizione a un corso a pagamento", async ({ page }) => {
  await accedi(page);

  await page.goto("/corsi/nuovo");
  await page.getByLabel("Titolo del corso").fill("Corso di fotografia");
  await page.getByLabel("Data di inizio").fill(new Date().toISOString().slice(0, 10));
  await page.getByLabel("Quota di partecipazione (€)").fill("40");
  await page.getByRole("button", { name: "Crea corso" }).click();
  await page.waitForURL(/\/corsi\/(?!nuovo)[^/]+$/);

  await page.getByRole("tab", { name: "Iscrizioni" }).click();
  await page.getByRole("button", { name: "Nuova iscrizione" }).click();
  await page.getByLabel("Persona").click();
  await page.getByRole("option", { name: "Verdi Giulia" }).click();
  await page.getByRole("button", { name: "Iscrivi" }).click();
  await expect(page.getByText("Confermato", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Genera quota" }).click();
  await expect(page.getByText("da_pagare")).toBeVisible();

  await page.getByRole("button", { name: "Incassa" }).click();
  await page.getByRole("button", { name: "Registra e genera ricevuta" }).click();
  await expect(page.getByText("pagata")).toBeVisible();
  await expect(page.getByRole("link", { name: /\d+\/\d{4}/ })).toBeVisible();
});
