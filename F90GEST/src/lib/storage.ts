import "server-only";
import { mkdir, writeFile, readFile } from "node:fs/promises";
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
