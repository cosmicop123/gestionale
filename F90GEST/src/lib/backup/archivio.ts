import "server-only";
import { mkdtemp, rm, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import Database from "better-sqlite3";
import AdmZip from "adm-zip";
import { risolviPercorsoDatabase } from "./percorso-database";
import { STORAGE_DIR } from "@/lib/storage";

export const NOME_FILE_DATABASE_NELLO_ZIP = "database.db";
export const NOME_CARTELLA_STORAGE_NELLO_ZIP = "storage";

/**
 * Costruisce lo ZIP di backup (§10: "unico punto da salvare per un backup
 * completo: database + allegati", vedi anche docker-compose.yml). Il
 * database non viene copiato a livello di filesystem: si usa l'Online
 * Backup API di SQLite (`Database#backup`, esposta da better-sqlite3) su una
 * connessione di sola lettura separata, l'unico modo corretto per ottenere
 * uno snapshot consistente di un database che l'app sta usando allo stesso
 * momento (una copia grezza del file rischierebbe di catturarlo a metà di
 * una scrittura).
 */
export async function creaArchivioBackup(): Promise<Buffer> {
  const cartellaTemp = await mkdtemp(join(tmpdir(), "f90gest-backup-"));
  try {
    const percorsoSnapshotDb = join(cartellaTemp, NOME_FILE_DATABASE_NELLO_ZIP);
    const db = new Database(risolviPercorsoDatabase(), { readonly: true, fileMustExist: true });
    try {
      await db.backup(percorsoSnapshotDb);
    } finally {
      db.close();
    }

    const zip = new AdmZip();
    zip.addLocalFile(percorsoSnapshotDb);
    if (existsSync(STORAGE_DIR)) {
      zip.addLocalFolder(STORAGE_DIR, NOME_CARTELLA_STORAGE_NELLO_ZIP);
    }
    return zip.toBuffer();
  } finally {
    await rm(cartellaTemp, { recursive: true, force: true });
  }
}

export type EsitoValidazioneBackup = { valido: true } | { valido: false; errore: string };

/**
 * Verifica che uno ZIP caricato abbia la struttura attesa prima di
 * qualunque scrittura su disco (§8: mai fidarsi di un file caricato senza
 * validarlo).
 */
export function validaArchivioBackup(zip: AdmZip): EsitoValidazioneBackup {
  const voci = zip.getEntries();
  const haDatabase = voci.some((v) => v.entryName === NOME_FILE_DATABASE_NELLO_ZIP);
  if (!haDatabase) {
    return { valido: false, errore: `Il file non contiene "${NOME_FILE_DATABASE_NELLO_ZIP}": non sembra un backup di F90GEST.` };
  }
  // Impedisce ai percorsi delle voci di uscire dalla cartella di estrazione
  // (path traversal / symlink verso destinazioni arbitrarie).
  for (const voce of voci) {
    if (voce.entryName.includes("..") || voce.entryName.startsWith("/")) {
      return { valido: false, errore: `Percorso non consentito nell'archivio: "${voce.entryName}".` };
    }
  }
  return { valido: true };
}

/**
 * Ripristina database e storage da un archivio già validato: sostituisce il
 * file del database e la cartella di storage attuali con quelli
 * dell'archivio. Non riavvia da sola la connessione al database in uso dal
 * processo — vedi la nota in `src/lib/backup/actions.ts` sul riavvio
 * necessario dell'applicazione dopo il ripristino.
 */
export async function ripristinaDaArchivio(zip: AdmZip): Promise<void> {
  const cartellaTemp = await mkdtemp(join(tmpdir(), "f90gest-restore-"));
  try {
    zip.extractAllTo(cartellaTemp, true);

    const { copyFile, rm: rimuovi, cp } = await import("node:fs/promises");
    const percorsoDbEstratto = join(cartellaTemp, NOME_FILE_DATABASE_NELLO_ZIP);
    await copyFile(percorsoDbEstratto, risolviPercorsoDatabase());

    const cartellaStorageEstratta = join(cartellaTemp, NOME_CARTELLA_STORAGE_NELLO_ZIP);
    if (existsSync(cartellaStorageEstratta)) {
      await rimuovi(STORAGE_DIR, { recursive: true, force: true });
      await mkdir(STORAGE_DIR, { recursive: true });
      await cp(cartellaStorageEstratta, STORAGE_DIR, { recursive: true });
    }
  } finally {
    await rm(cartellaTemp, { recursive: true, force: true });
  }
}
