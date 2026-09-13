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

// Riusa "Giulia Verdi" (socia dal 03-contabilita.spec.ts) e il conto "Cassa
// contanti" creato nello stesso test.
test("flusso critico: evento con partecipanti, check-in, incasso, turni, SIAE e sponsor", async ({ page }) => {
  await accedi(page);

  // 1. Crea un evento a pagamento
  await page.goto("/eventi/nuovo");
  await page.getByLabel("Titolo").fill("Festa d'estate");
  await page.getByLabel("Tipo di ingresso").click();
  await page.getByRole("option", { name: "Corrispettivo (biglietto)" }).click();
  await page.getByRole("button", { name: "Crea evento" }).click();
  await page.waitForURL(/\/eventi\/(?!nuovo)[^/]+$/);

  // 2. Aggiunge due partecipanti (uno non censito, uno censito)
  await page.getByRole("button", { name: "Aggiungi partecipante" }).click();
  await page.getByLabel("Nome (se non censito)").fill("Mario Ospite");
  await page.getByLabel("Biglietto/oblazione (€)").fill("10");
  await page.getByRole("button", { name: "Aggiungi" }).click();
  await expect(page.getByText("Mario Ospite")).toBeVisible();

  await page.getByRole("button", { name: "Aggiungi partecipante" }).click();
  await page.getByLabel("Persona censita (facoltativo)").click();
  await page.getByRole("option", { name: "Verdi Giulia" }).click();
  await page.getByRole("button", { name: "Aggiungi" }).click();
  await expect(page.getByRole("row", { name: /Verdi Giulia/ })).toBeVisible();

  // 3. Check-in manuale di un partecipante
  await page.getByRole("row", { name: /Mario Ospite/ }).getByRole("button", { name: "Check-in" }).click();
  await expect(page.getByRole("row", { name: /Mario Ospite/ }).getByText("Manuale")).toBeVisible();

  // 4. Registra l'incasso dell'evento
  await page.getByRole("button", { name: "Registra incasso" }).click();
  await page.getByRole("button", { name: "Registra", exact: true }).click();
  await expect(page.getByText(/Incasso registrato/)).toBeVisible();

  // 5. Propone e conferma un turno volontario
  await page.getByRole("tab", { name: "Turni volontari" }).click();
  await page.getByRole("button", { name: "Proponi turno" }).click();
  await page.getByLabel("Volontario", { exact: true }).click();
  await page.getByRole("option", { name: "Verdi Giulia" }).click();
  await page.getByLabel("Mansione").fill("Banco bar");
  await page.getByRole("button", { name: "Proponi", exact: true }).click();
  await expect(page.getByText("Banco bar")).toBeVisible();
  const rigaTurno = page.getByRole("row", { name: /Banco bar/ });
  await rigaTurno.getByRole("combobox").click();
  await page.getByRole("option", { name: "Confermato" }).click();

  // 6. Predispone la pratica SIAE e aggiunge un brano al programma
  await page.getByRole("tab", { name: "SIAE" }).click();
  await page.getByLabel("Tipo di permesso").fill("Trattenimento danzante");
  await page.getByRole("button", { name: "Salva pratica" }).click();
  await expect(page.getByText("Programma musicale")).toBeVisible();

  await page.getByRole("button", { name: "Aggiungi brano" }).click();
  await page.getByLabel("Titolo", { exact: true }).fill("Volare");
  await page.getByLabel("Autore", { exact: true }).fill("Domenico Modugno");
  await page.getByRole("button", { name: "Aggiungi", exact: true }).click();
  await expect(page.getByRole("cell", { name: "Volare", exact: true })).toBeVisible();

  // 7. Registra e incassa uno sponsor collegato all'evento
  await page.getByRole("tab", { name: "Sponsor" }).click();
  await page.getByRole("button", { name: "Nuovo sponsor/contributo" }).click();
  await page.getByLabel("Ragione sociale (se non censito)").fill("Panificio Rossi");
  await page.getByLabel("Importo (€)").fill("50");
  await page.getByRole("button", { name: "Registra", exact: true }).click();
  await expect(page.getByText("Panificio Rossi")).toBeVisible();

  await page.getByRole("button", { name: "Accetta" }).click();
  await page.getByRole("button", { name: "Incassa" }).click();
  await page.getByRole("button", { name: "Conferma incasso" }).click();
  await expect(page.getByText("Incassato", { exact: true })).toBeVisible();

  // 8. Lo sponsor compare anche nell'elenco globale
  await page.goto("/eventi/sponsor");
  await expect(page.getByText("Panificio Rossi")).toBeVisible();
  await expect(page.getByText("Festa d'estate")).toBeVisible();
});

test("flusso critico: raccolta fondi con movimento registrato", async ({ page }) => {
  await accedi(page);

  await page.goto("/eventi/raccolte-fondi/nuova");
  await page.getByLabel("Denominazione").fill("Raccolta fondi Natale");
  await page.getByRole("button", { name: "Crea raccolta fondi" }).click();
  await page.waitForURL(/\/eventi\/raccolte-fondi\/(?!nuova)[^/]+$/);

  await page.getByRole("button", { name: "Registra movimento" }).click();
  await page.getByRole("dialog").getByLabel("Importo (€)").fill("20");
  await page.getByLabel("Causale").fill("Offerte raccolte al banchetto");
  await page.getByRole("button", { name: "Registra", exact: true }).click();

  await expect(page.getByText("20,00 €").first()).toBeVisible();
});
