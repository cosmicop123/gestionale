-- CreateTable
CREATE TABLE "TemplateDocumento" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nome" TEXT NOT NULL,
    "descrizione" TEXT,
    "corpoTesto" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "createdById" TEXT,
    "deletedAt" DATETIME,
    CONSTRAINT "TemplateDocumento_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Utente" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
