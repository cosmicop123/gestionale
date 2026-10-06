-- CreateTable
CREATE TABLE "CasellaEmail" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tipo" TEXT NOT NULL,
    "etichetta" TEXT NOT NULL,
    "indirizzoEmail" TEXT NOT NULL,
    "smtpHost" TEXT NOT NULL,
    "smtpPorta" INTEGER NOT NULL,
    "smtpSicurezza" TEXT NOT NULL,
    "smtpUtente" TEXT NOT NULL,
    "smtpPasswordCifrata" TEXT NOT NULL,
    "imapHost" TEXT NOT NULL,
    "imapPorta" INTEGER NOT NULL,
    "imapSicurezza" TEXT NOT NULL,
    "imapUtente" TEXT NOT NULL,
    "imapPasswordCifrata" TEXT NOT NULL,
    "attiva" BOOLEAN NOT NULL DEFAULT true,
    "ultimaSincImap" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "createdById" TEXT,
    "deletedAt" DATETIME,
    CONSTRAINT "CasellaEmail_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Utente" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MessaggioEmailRicevuto" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "casellaEmailId" TEXT NOT NULL,
    "uidImap" INTEGER NOT NULL,
    "mittente" TEXT NOT NULL,
    "oggetto" TEXT NOT NULL,
    "dataMessaggio" DATETIME NOT NULL,
    "corpoTesto" TEXT,
    "corpoHtml" TEXT,
    "letto" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MessaggioEmailRicevuto_casellaEmailId_fkey" FOREIGN KEY ("casellaEmailId") REFERENCES "CasellaEmail" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "CasellaEmail_tipo_attiva_idx" ON "CasellaEmail"("tipo", "attiva");

-- CreateIndex
CREATE INDEX "MessaggioEmailRicevuto_casellaEmailId_letto_idx" ON "MessaggioEmailRicevuto"("casellaEmailId", "letto");

-- CreateIndex
CREATE UNIQUE INDEX "MessaggioEmailRicevuto_casellaEmailId_uidImap_key" ON "MessaggioEmailRicevuto"("casellaEmailId", "uidImap");
