import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  reporter: "list",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  webServer: {
    // La preparazione del database (azzeramento + migrazioni + seed) deve
    // finire PRIMA che "next start" venga anche solo avviato, non durante
    // il globalSetup di Playwright: quest'ultimo gira dopo che il plugin
    // webServer è già stato avviato e considerato "disponibile" (ordine
    // interno di Playwright, non documentato esplicitamente ma verificato
    // in node_modules/playwright/lib/runner/index.js, createGlobalSetupTasks).
    // Con un comando separato + globalSetup, il probe di disponibilità del
    // webServer (una richiesta HTTP a "/") poteva far apprire la connessione
    // SQLite (singleton di tutta la vita del processo) sul vecchio file,
    // che il globalSetup cancellava e ricreava un istante dopo — la
    // connessione restava così "agganciata" a un file ormai spostato
    // (SQLITE_READONLY_DBMOVED), e ogni scrittura successiva per l'intera
    // run falliva. Vedi nota di continuità in CLAUDE.md.
    command: "npm run test:e2e:prepara-db && npm run start",
    url: "http://localhost:3000",
    reuseExistingServer: false,
    timeout: 60_000,
    env: {
      DATABASE_URL: "file:./prisma/e2e-test.db",
      // Necessaria per salvare una casella email/PEC dai test e2e (cifratura
      // delle password, src/lib/email/cifratura.ts): un valore fisso va bene
      // qui, non è usata per cifrare dati reali.
      EMAIL_CIFRATURA_SECRET: "segreto-di-test-e2e-non-usare-in-produzione",
    },
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        launchOptions: {
          executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH,
        },
      },
    },
  ],
});
