"use server";
import "server-only";
import { writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import AdmZip from "adm-zip";
import { prisma } from "@/lib/prisma";
import { richiediRuolo } from "@/lib/auth/richiedi-utente";
import { registraAudit } from "@/lib/audit";
import { STORAGE_DIR } from "@/lib/storage";
import { creaArchivioBackup, validaArchivioBackup, ripristinaDaArchivio } from "./archivio";

const FRASE_CONFERMA_RIPRISTINO = "RIPRISTINA";

/**
 * Il ripristino sovrascrive database e allegati: richiede di digitare una
 * frase di conferma esplicita (oltre al ruolo amministratore) per ridurre
 * il rischio di un'azione distruttiva innescata per errore (§8, principio
 * generale di conferma per le azioni irreversibili).
 */
export async function ripristinaBackup(
  formData: FormData
): Promise<{ errore: string } | { ok: true; messaggio: string }> {
  const utente = await richiediRuolo(["amministratore"]);

  const conferma = String(formData.get("conferma") ?? "");
  if (conferma !== FRASE_CONFERMA_RIPRISTINO) {
    return { errore: `Digitare esattamente "${FRASE_CONFERMA_RIPRISTINO}" per confermare il ripristino.` };
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { errore: "Selezionare un file di backup (.zip)." };
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  let zip: AdmZip;
  try {
    zip = new AdmZip(buffer);
  } catch {
    return { errore: "Il file caricato non è un archivio ZIP valido." };
  }

  const validazione = validaArchivioBackup(zip);
  if (!validazione.valido) {
    return { errore: validazione.errore };
  }

  // Backup di sicurezza dello stato attuale prima di sovrascrivere: se il
  // ripristino fosse quello sbagliato, resta un modo per tornare indietro.
  try {
    const backupDiSicurezza = await creaArchivioBackup();
    const cartellaSicurezza = join(STORAGE_DIR, "backup-pre-ripristino");
    await mkdir(cartellaSicurezza, { recursive: true });
    const nomeFile = `backup-pre-ripristino-${new Date().toISOString().replace(/[:.]/g, "-")}.zip`;
    await writeFile(join(cartellaSicurezza, nomeFile), backupDiSicurezza);
  } catch (errore) {
    console.error("Impossibile creare il backup di sicurezza pre-ripristino:", errore);
  }

  // Registrato PRIMA di sovrascrivere il database: dopo la sostituzione del
  // file, la connessione già aperta non deve più scriverci (vedi nota sul
  // riavvio necessario più sotto).
  await registraAudit({ utenteId: utente.id, entita: "Backup", entitaId: "ripristino", azione: "ripristino" });

  await ripristinaDaArchivio(zip);
  await prisma.$disconnect();

  return {
    ok: true,
    messaggio:
      "Ripristino completato sul disco. Riavviare ora l'applicazione (o il container Docker) perché il processo in esecuzione apra il database ripristinato: fino al riavvio l'app potrebbe continuare a mostrare i vecchi dati o comportarsi in modo incoerente.",
  };
}
