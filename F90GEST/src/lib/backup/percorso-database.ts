import "server-only";
import { resolve } from "node:path";

/**
 * Il driver adapter (`src/lib/prisma.ts`) passa `DATABASE_URL` direttamente a
 * better-sqlite3, che risolve un percorso "file:" relativo alla directory di
 * lavoro del processo Node (`process.cwd()`) — diversa dalla risoluzione
 * della CLI Prisma, che lo risolve rispetto a `prisma/schema.prisma` (per
 * questo un `DATABASE_URL` relativo in sviluppo crea il file nella radice
 * del progetto, non in `prisma/`). Il backup deve leggere lo stesso file che
 * l'app ha realmente aperto, quindi replica qui la stessa risoluzione.
 */
export function risolviPercorsoDatabase(): string {
  const url = process.env.DATABASE_URL ?? "file:./dev.db";
  const percorso = url.replace(/^file:/, "");
  // turbopackIgnore: percorso di un file a runtime (il database SQLite),
  // non un asset da tracciare/impacchettare nella build — stesso principio
  // già applicato a STORAGE_DIR in src/lib/storage.ts.
  return resolve(/* turbopackIgnore: true */ process.cwd(), percorso);
}
