"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { richiediRuolo } from "@/lib/auth/richiedi-utente";
import { registraAudit } from "@/lib/audit";
import { salvaAllegato } from "@/lib/storage";
import { schemaDocumento, type DatiDocumento } from "@/lib/validazioni/protocollo";

export type EsitoAzione = { errore: string } | { successo: true };

const RUOLI_GESTIONE = ["amministratore", "segreteria"];

export async function caricaDocumento(datiGrezzi: DatiDocumento, formData: FormData): Promise<EsitoAzione> {
  const utente = await richiediRuolo(RUOLI_GESTIONE);

  const risultato = schemaDocumento.safeParse(datiGrezzi);
  if (!risultato.success) {
    return { errore: risultato.error.issues[0]?.message ?? "Dati non validi." };
  }
  const dati = risultato.data;

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { errore: "Selezionare un file da caricare." };
  }

  const documentoId = crypto.randomUUID();
  const buffer = Buffer.from(await file.arrayBuffer());
  const allegato = await salvaAllegato({
    entitaTipo: "Documento",
    entitaId: documentoId,
    nomeFileOriginale: file.name,
    mimeType: file.type || "application/octet-stream",
    buffer,
    createdById: utente.id,
  });

  await prisma.documento.create({
    data: {
      id: documentoId,
      titolo: dati.titolo,
      categoria: dati.categoria,
      allegatoId: allegato.id,
      scadenza: dati.scadenza ? new Date(dati.scadenza) : null,
      createdById: utente.id,
    },
  });

  await registraAudit({ utenteId: utente.id, entita: "Documento", entitaId: documentoId, azione: "caricamento" });

  revalidatePath("/documenti");
  return { successo: true };
}

/**
 * Sostituisce il file di un documento esistente con una nuova versione:
 * incrementa `versione` invece di creare un nuovo `Documento`, così lo
 * storico dei titoli/categorie resta un'unica riga (il file precedente
 * resta comunque sul disco come `Allegato` a sé, mai sovrascritto).
 */
export async function caricaNuovaVersioneDocumento(documentoId: string, formData: FormData): Promise<EsitoAzione> {
  const utente = await richiediRuolo(RUOLI_GESTIONE);

  const documento = await prisma.documento.findUnique({ where: { id: documentoId } });
  if (!documento || documento.deletedAt) return { errore: "Documento non trovato." };

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { errore: "Selezionare un file da caricare." };
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const allegato = await salvaAllegato({
    entitaTipo: "Documento",
    entitaId: documentoId,
    nomeFileOriginale: file.name,
    mimeType: file.type || "application/octet-stream",
    buffer,
    createdById: utente.id,
  });

  await prisma.documento.update({
    where: { id: documentoId },
    data: { allegatoId: allegato.id, versione: { increment: 1 } },
  });

  await registraAudit({ utenteId: utente.id, entita: "Documento", entitaId: documentoId, azione: "nuova_versione" });

  revalidatePath("/documenti");
  return { successo: true };
}

export async function eliminaDocumento(documentoId: string): Promise<EsitoAzione> {
  const utente = await richiediRuolo(RUOLI_GESTIONE);

  const documento = await prisma.documento.findUnique({ where: { id: documentoId } });
  if (!documento || documento.deletedAt) return { errore: "Documento non trovato." };

  await prisma.documento.update({ where: { id: documentoId }, data: { deletedAt: new Date() } });

  await registraAudit({ utenteId: utente.id, entita: "Documento", entitaId: documentoId, azione: "eliminazione" });

  revalidatePath("/documenti");
  return { successo: true };
}
