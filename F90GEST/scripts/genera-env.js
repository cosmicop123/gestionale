// Genera il file .env al primo avvio dell'installer Windows, con percorsi
// ASSOLUTI per database e storage (mai relativi): la CLI di Prisma risolve
// i percorsi "file:" relativi rispetto alla cartella di prisma/schema.prisma,
// mentre l'app stessa (driver adapter better-sqlite3, src/lib/prisma.ts) li
// risolve rispetto a process.cwd() — due basi diverse che con un percorso
// relativo punterebbero a due file diversi. Un percorso assoluto elimina
// l'ambiguità (stessa soluzione già usata in docker-compose.yml).
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const cartellaApp = path.join(__dirname, "..");
const envPath = path.join(cartellaApp, ".env");

if (fs.existsSync(envPath)) {
  console.log(".env già presente: non lo sovrascrivo (installazione aggiornata, non nuova).");
  process.exit(0);
}

function percorsoUrl(p) {
  return p.split(path.sep).join("/");
}

const percorsoDb = percorsoUrl(path.join(cartellaApp, "prisma", "data", "gestionale.db"));
const percorsoStorage = percorsoUrl(path.join(cartellaApp, "storage"));
const segreto = crypto.randomBytes(32).toString("base64");

const contenuto = `DATABASE_URL="file:${percorsoDb}"
SESSION_SECRET="${segreto}"
STORAGE_DIR="${percorsoStorage}"
SMTP_HOST=""
SMTP_PORT="587"
SMTP_USER=""
SMTP_PASSWORD=""
SMTP_FROM="Associazione <no-reply@example.org>"
`;

fs.mkdirSync(path.join(cartellaApp, "prisma", "data"), { recursive: true });
fs.mkdirSync(path.join(cartellaApp, "storage"), { recursive: true });
fs.writeFileSync(envPath, contenuto, "utf-8");
console.log("File .env generato con un SESSION_SECRET casuale e percorsi assoluti per database e storage.");
