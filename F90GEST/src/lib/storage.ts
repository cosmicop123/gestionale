import "server-only";
import { mkdir, writeFile, readFile, unlink } from "node:fs/promises";
import { join, dirname, extname } from "node:path";
import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";

// Cartella di storage per allegati e documenti generati (§10, variabile
// STORAGE_DIR): un'unica cartella facile da includere nel backup insieme
// al database.
export const STORAGE_DIR = process.env.STORAGE_DIR ?? "./storage";

/**
 * Salva un file sul disco e crea la riga Allegato collegata (§5.7:
 * associazione polimorfica generica via entitaTipo/entitaId). Il nome file
 * su disco è un id casuale: mai fidarsi del nome originale per il path.
 */
export async function salvaAllegato(dati: {
  entitaTipo: string;
  entitaId: string;
  nomeFileOriginale: string;
  mimeType: string;
  buffer: Buffer;
  createdById?: string | null;
}): Promise<{ id: string; percorso: string }> {
  const estensione = extname(dati.nomeFileOriginale) || "";
  const nomeFile = `${randomUUID()}${estensione}`;
  const percorsoRelativo = join(dati.entitaTipo.toLowerCase(), nomeFile);
  // turbopackIgnore: STORAGE_DIR è una cartella a runtime (volume Docker),
  // non un asset da includere nel build — altrimenti Turbopack traccerebbe
  // e impacchetterebbe l'intero progetto nell'output del server.
  const percorsoAssoluto = join(/* turbopackIgnore: true */ STORAGE_DIR, percorsoRelativo);

  await mkdir(dirname(percorsoAssoluto), { recursive: true });
  await writeFile(percorsoAssoluto, dati.buffer);

  const allegato = await prisma.allegato.create({
    data: {
      entitaTipo: dati.entitaTipo,
      entitaId: dati.entitaId,
      nomeFile,
      nomeFileOriginale: dati.nomeFileOriginale,
      mimeType: dati.mimeType,
      dimensioneByte: dati.buffer.byteLength,
      percorso: percorsoRelativo,
      createdById: dati.createdById ?? null,
    },
  });

  return { id: allegato.id, percorso: percorsoRelativo };
}

export async function leggiAllegato(allegatoId: string): Promise<{ buffer: Buffer; mimeType: string; nomeFileOriginale: string } | null> {
  const allegato = await prisma.allegato.findUnique({ where: { id: allegatoId } });
  if (!allegato || allegato.deletedAt) return null;

  const buffer = await readFile(join(/* turbopackIgnore: true */ STORAGE_DIR, allegato.percorso));
  return { buffer, mimeType: allegato.mimeType, nomeFileOriginale: allegato.nomeFileOriginale };
}

/**
 * Legge un allegato immagine (logo, firma) e lo restituisce come data URI,
 * pronto per la prop `src` di un `<Image>` di @react-pdf/renderer. Estratta
 * da `src/lib/ricevuta/genera.ts` (dove era privata) quando è servita una
 * seconda volta per un altro generatore di PDF (Compilatore comunicazioni):
 * stessa logica, un solo punto da mantenere.
 */
export async function datiUriAllegato(allegatoId: string | null | undefined): Promise<string | null> {
  if (!allegatoId) return null;
  const allegato = await leggiAllegato(allegatoId);
  if (!allegato) return null;
  return `data:${allegato.mimeType};base64,${allegato.buffer.toString("base64")}`;
}

/**
 * Cancellazione reale (non soft-delete) del file e della riga Allegato:
 * da usare solo quando anche l'entità proprietaria viene cancellata per
 * davvero (es. ricevute errate rimosse da un'operazione di manutenzione),
 * mai per il normale ciclo di vita di un allegato (quello usa solo la
 * lettura/sostituzione, coerente con il resto dell'app). Tollera un file
 * già mancante su disco: l'obiettivo è che la riga Allegato sparisca
 * comunque, non bloccarsi su un'incoerenza minore.
 */
export async function eliminaAllegato(allegatoId: string): Promise<void> {
  const allegato = await prisma.allegato.findUnique({ where: { id: allegatoId } });
  if (!allegato) return;

  try {
    await unlink(join(/* turbopackIgnore: true */ STORAGE_DIR, allegato.percorso));
  } catch {
    // file già assente: non impedisce la pulizia della riga DB.
  }
  await prisma.allegato.delete({ where: { id: allegatoId } });
}
