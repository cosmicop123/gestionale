-- CreateTable
CREATE TABLE "DomandaAmmissione" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "personaId" TEXT NOT NULL,
    "dataDomanda" DATETIME NOT NULL,
    "categoriaProposta" TEXT NOT NULL,
    "note" TEXT,
    "stato" TEXT NOT NULL DEFAULT 'in_valutazione',
    "dataEsito" DATETIME,
    "motivoRigetto" TEXT,
    "socioId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "createdById" TEXT,
    "deletedAt" DATETIME,
    CONSTRAINT "DomandaAmmissione_personaId_fkey" FOREIGN KEY ("personaId") REFERENCES "Persona" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "DomandaAmmissione_socioId_fkey" FOREIGN KEY ("socioId") REFERENCES "Socio" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "DomandaAmmissione_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Utente" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "DomandaAmmissione_socioId_key" ON "DomandaAmmissione"("socioId");

-- CreateIndex
CREATE INDEX "DomandaAmmissione_personaId_idx" ON "DomandaAmmissione"("personaId");

-- CreateIndex
CREATE INDEX "DomandaAmmissione_stato_idx" ON "DomandaAmmissione"("stato");
