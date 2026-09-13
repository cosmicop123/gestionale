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

test("flusso critico: informativa privacy, iscrizione pubblica (adulto e minore), conferma interna", async ({
  page,
}) => {
  await accedi(page);

  // 1. Pubblica una versione dell'informativa privacy (obbligatoria perché
  // il modulo pubblico si attivi)
  await page.goto("/amministrazione");
  await page.getByRole("tab", { name: "Informativa privacy" }).click();
  await page.getByLabel("Testo dell'informativa").fill(
    "Informativa di prova ai sensi degli artt. 13-14 del Regolamento (UE) 2016/679, predisposta dall'associazione."
  );
  await page.getByRole("button", { name: "Pubblica nuova versione" }).click();
  await expect(page.getByText("Versione attualmente pubblicata")).toBeVisible();

  // 2. Crea un corso e lo apre alle iscrizioni
  const dataOggiInput = new Date().toISOString().slice(0, 10);
  await page.goto("/corsi/nuovo");
  await page.getByLabel("Titolo del corso").fill("Corso di pittura");
  await page.getByLabel("Data di inizio").fill(dataOggiInput);
  await page.getByRole("button", { name: "Crea corso" }).click();
  await page.waitForURL(/\/corsi\/(?!nuovo)[^/]+$/);
  const urlCorso = page.url();

  await page.getByRole("combobox").first().click();
  await page.getByRole("option", { name: "Aperto alle iscrizioni" }).click();
  await expect(page.getByRole("combobox").first()).toContainText("Aperto alle iscrizioni");

  // 3. Dalla pagina pubblica, un adulto si preiscrive
  await page.goto("/iscrizione");
  await expect(page.getByText("Corso di pittura")).toBeVisible();
  await page.getByRole("link", { name: "Iscriviti" }).click();
  await page.waitForURL(/\/iscrizione\/[^/]+$/);

  await page.getByLabel("Nome *", { exact: true }).fill("Paolo");
  await page.getByLabel("Cognome *", { exact: true }).fill("Neri");
  await page.getByLabel("Codice fiscale *").fill("NRIPLA90C15H501F");
  await page.getByLabel("Data di nascita *").fill("1990-03-15");
  await page.getByLabel("Email", { exact: true }).fill("paolo.neri@example.com");
  await page.getByLabel(/Acconsento al trattamento dei dati/).check();
  await page.getByRole("button", { name: "Invia richiesta di iscrizione" }).click();
  await expect(page.getByText("Richiesta di iscrizione inviata.")).toBeVisible();

  // 4. Un minorenne si preiscrive, con i dati del genitore obbligatori
  await page.goto(`/iscrizione/${urlCorso.split("/corsi/")[1]}`);
  await page.getByLabel("Nome *", { exact: true }).fill("Luca");
  await page.getByLabel("Cognome *", { exact: true }).fill("Bianchi");
  await page.getByLabel("Codice fiscale *").fill("BNCLCU15E10H501M");
  await page.getByLabel("Data di nascita *").fill("2015-05-10");
  await page.locator("#telefono").fill("3331234567");
  await expect(page.getByText("Esercente la responsabilità genitoriale")).toBeVisible();
  await page.getByLabel("Nome e cognome *").fill("Giovanna Bianchi");
  await page.getByLabel("Grado di parentela *").click();
  await page.getByRole("option", { name: "Genitore", exact: true }).click();
  await page.getByLabel(/Acconsento al trattamento dei dati/).check();
  await page.getByRole("button", { name: "Invia richiesta di iscrizione" }).click();
  await expect(page.getByText("Richiesta di iscrizione inviata.")).toBeVisible();

  // 5. La segreteria vede entrambe le preiscrizioni e le conferma
  await page.goto(urlCorso);
  await page.getByRole("tab", { name: "Iscrizioni" }).click();
  await expect(page.getByText("Preiscritto").first()).toBeVisible();
  await page.getByRole("button", { name: "Conferma" }).first().click();
  await expect(page.getByText("Confermato").first()).toBeVisible();

  // 6. I dati del genitore del minore sono visibili sulla sua scheda
  await page.goto("/soci");
  await page.getByRole("link", { name: "Bianchi Luca" }).click();
  await expect(page.getByText("Esercente la responsabilità genitoriale")).toBeVisible();
  await expect(page.getByText("Giovanna Bianchi")).toBeVisible();
});
