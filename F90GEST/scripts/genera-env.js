// Genera (o completa) il file .env eseguito dall'installer Windows ad ogni
// installazione — sia la prima volta sia un aggiornamento su un'installazione
// esistente. Percorsi ASSOLUTI per database e storage (mai relativi): la CLI
// di Prisma risolve i percorsi "file:" relativi rispetto alla cartella di
// prisma/schema.prisma, mentre l'app stessa (driver adapter
// better-sqlite3, src/lib/prisma.ts) li risolve rispetto a process.cwd() —
// due basi diverse che con un percorso relativo punterebbero a due file
// diversi. Un percorso assoluto elimina l'ambiguità (stessa soluzione già
// usata in docker-compose.yml).
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const cartellaApp = path.join(__dirname, "..");
const envPath = path.join(cartellaApp, ".env");

function percorsoUrl(p) {
  return p.split(path.sep).join("/");
}

const percorsoDb = percorsoUrl(path.join(cartellaApp, "prisma", "data", "gestionale.db"));
const percorsoStorage = percorsoUrl(path.join(cartellaApp, "storage"));

// Valori di default per una nuova variabile: usati solo se quella riga non
// esiste già nel .env (nuova installazione, o aggiornamento da una versione
// precedente che non la prevedeva ancora — es. EMAIL_CIFRATURA_SECRET,
// introdotta dopo le prime versioni di questo installer). Non toccare MAI
// una riga già presente: altrimenti un aggiornamento rigenererebbe
// SESSION_SECRET ad ogni installazione, invalidando tutte le sessioni
// attive, o sovrascriverebbe una configurazione SMTP già personalizzata.
const VARIABILI_DI_DEFAULT = () => [
  [`DATABASE_URL`, `"file:${percorsoDb}"`],
  [`SESSION_SECRET`, `"${crypto.randomBytes(32).toString("base64")}"`],
  [`EMAIL_CIFRATURA_SECRET`, `"${crypto.randomBytes(32).toString("base64")}"`],
  [`STORAGE_DIR`, `"${percorsoStorage}"`],
  [`SMTP_HOST`, `""`],
  [`SMTP_PORT`, `"587"`],
  [`SMTP_USER`, `""`],
  [`SMTP_PASSWORD`, `""`],
  [`SMTP_FROM`, `"Associazione <no-reply@example.org>"`],
];

fs.mkdirSync(path.join(cartellaApp, "prisma", "data"), { recursive: true });
fs.mkdirSync(path.join(cartellaApp, "storage"), { recursive: true });

if (!fs.existsSync(envPath)) {
  const contenuto = VARIABILI_DI_DEFAULT()
    .map(([chiave, valore]) => `${chiave}=${valore}`)
    .join("\n") + "\n";
  fs.writeFileSync(envPath, contenuto, "utf-8");
  console.log("File .env generato con segreti casuali e percorsi assoluti per database e storage.");
  process.exit(0);
}

// Installazione aggiornata, non nuova: completa solo le variabili che
// ancora non esistono (introdotte da una versione più recente), senza
// toccare una sola riga di quelle già presenti.
const righeEsistenti = fs.readFileSync(envPath, "utf-8").split("\n");
const chiaviPresenti = new Set(
  righeEsistenti
    .map((riga) => riga.match(/^([A-Z_][A-Z0-9_]*)=/))
    .filter(Boolean)
    .map((m) => m[1])
);

const righeDaAggiungere = VARIABILI_DI_DEFAULT()
  .filter(([chiave]) => !chiaviPresenti.has(chiave))
  .map(([chiave, valore]) => `${chiave}=${valore}`);

if (righeDaAggiungere.length === 0) {
  console.log(".env già completo: nessuna nuova variabile da aggiungere.");
  process.exit(0);
}

const separatore = righeEsistenti[righeEsistenti.length - 1] === "" ? "" : "\n";
fs.appendFileSync(envPath, separatore + righeDaAggiungere.join("\n") + "\n", "utf-8");
console.log(`.env aggiornato: aggiunte ${righeDaAggiungere.length} nuove variabili (${righeDaAggiungere
  .map((r) => r.split("=")[0])
  .join(", ")}).`);
