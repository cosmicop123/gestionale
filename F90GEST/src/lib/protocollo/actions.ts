"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { richiediRuolo } from "@/lib/auth/richiedi-utente";
import { registraAudit } from "@/lib/audit";
import { prossimoNumero } from "@/lib/numeratore";
import { salvaAllegato } from "@/lib/storage";
import { schemaProtocollo, type DatiProtocollo } from "@/lib/validazioni/protocollo";

export type EsitoAzione = { errore: string } | { successo: true };

const RUOLI_GESTIONE = ["amministratore", "segreteria"];

/**
 * Registra un protocollo in entrata o in uscita: numerazione progressiva
 * annuale per tipo (`protocollo_entrata`/`protocollo_uscita`), mai
 * riassegnata (§7.1, stesso principio del libro soci e delle ricevute).
 * L'eventuale allegato viene salvato dopo la creazione della riga, con id
 * generato lato applicazione per evitare un update successivo su questa
 * entità (§8, stesso schema già usato per i giustificativi di prima nota).
 */
export async function registraProtocollo(datiGrezzi: DatiProtocollo, formData?: FormData): Promise<EsitoAzione> {
  const utente = await richiediRuolo(RUOLI_GESTIONE);

  const risultato = schemaProtocollo.safeParse(datiGrezzi);
  if (!risultato.success) {
    return { errore: risultato.error.issues[0]?.message ?? "Dati non validi." };
  }
  const dati = risultato.data;
  const data = new Date(dati.data);
  const annoRiferimento = data.getFullYear();

  const file = formData?.get("allegato");
  let bufferAllegato: Buffer | null = null;
  let nomeFileAllegato = "";
  let mimeTypeAllegato = "";
  if (file instanceof File && file.size > 0) {
    bufferAllegato = Buffer.from(await file.arrayBuffer());
    nomeFileAllegato = file.name;
    mimeTypeAllegato = file.type || "application/octet-stream";
  }

  const protocolloId = await prisma.$transaction(async (tx) => {
    const numero = await prossimoNumero(tx, `protocollo_${dati.tipo}`, annoRiferimento);

    const protocollo = await tx.protocollo.create({
      data: {
        numero,
        annoRiferimento,
        tipo: dati.tipo,
        data,
        mittenteDestinatario: dati.mittenteDestinatario,
        oggetto: dati.oggetto,
        mezzo: dati.mezzo,
        classificazione: dati.classificazione || null,
        createdById: utente.id,
      },
    });
    return protocollo.id;
  });

  if (bufferAllegato) {
    const allegato = await salvaAllegato({
      entitaTipo: "Protocollo",
      entitaId: protocolloId,
      nomeFileOriginale: nomeFileAllegato,
      mimeType: mimeTypeAllegato,
      buffer: bufferAllegato,
      createdById: utente.id,
    });
    await prisma.protocollo.update({ where: { id: protocolloId }, data: { allegatoId: allegato.id } });
  }

  await registraAudit({ utenteId: utente.id, entita: "Protocollo", entitaId: protocolloId, azione: "registrazione" });

  revalidatePath("/documenti");
  return { successo: true };
}
