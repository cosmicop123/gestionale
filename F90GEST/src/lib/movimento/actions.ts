"use server";

import { revalidatePath } from "next/cache";
import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { richiediRuolo } from "@/lib/auth/richiedi-utente";
import { registraAudit } from "@/lib/audit";
import { salvaAllegato } from "@/lib/storage";
import { ottieniParametriContabilita } from "@/lib/parametri";
import { schemaMovimentoManuale, schemaStorno } from "@/lib/validazioni/contabilita";

export type EsitoMovimento = { errore: string } | { successo: true };

/**
 * Registra un movimento di prima nota non collegato a un pagamento (es.
 * spese associative, contributi diretti). Accetta FormData (non un oggetto
 * tipizzato da react-hook-form) perché deve poter includere anche il file
 * del giustificativo nello stesso invio (§6 M3: allegato obbligatorio o
 * motivazione per le uscite sopra soglia).
 */
export async function registraMovimentoManuale(formData: FormData): Promise<EsitoMovimento> {
  const utente = await richiediRuolo(["amministratore", "tesoriere"]);

  const risultato = schemaMovimentoManuale.safeParse({
    tipo: formData.get("tipo"),
    data: formData.get("data"),
    importo: formData.get("importo"),
    contoId: formData.get("contoId"),
    causale: formData.get("causale"),
    categoriaRendiconto: formData.get("categoriaRendiconto"),
    descrizione: formData.get("descrizione") ?? "",
    controparteFornitore: formData.get("controparteFornitore") ?? "",
    motivazioneAssenzaGiustificativo: formData.get("motivazioneAssenzaGiustificativo") ?? "",
  });
  if (!risultato.success) {
    return { errore: risultato.error.issues[0]?.message ?? "Dati non validi." };
  }
  const dati = risultato.data;
  const importo = Number(dati.importo);

  const file = formData.get("giustificativo");
  const haFile = file instanceof File && file.size > 0;

  if (dati.tipo === "uscita") {
    const parametri = await ottieniParametriContabilita();
    if (importo > parametri.sogliaGiustificativoObbligatorioEuro && !haFile && !dati.motivazioneAssenzaGiustificativo) {
      return {
        errore: `Per le uscite superiori a € ${parametri.sogliaGiustificativoObbligatorioEuro.toFixed(2)} è obbligatorio allegare un giustificativo o indicare una motivazione.`,
      };
    }
  }

  const movimentoId = randomUUID();
  let allegatoId: string | undefined;
  if (haFile) {
    const buffer = Buffer.from(await (file as File).arrayBuffer());
    const allegato = await salvaAllegato({
      entitaTipo: "MovimentoPrimaNota",
      entitaId: movimentoId,
      nomeFileOriginale: (file as File).name,
      mimeType: (file as File).type || "application/octet-stream",
      buffer,
      createdById: utente.id,
    });
    allegatoId = allegato.id;
  }

  await prisma.movimentoPrimaNota.create({
    data: {
      id: movimentoId,
      data: new Date(dati.data),
      tipo: dati.tipo,
      importo,
      contoId: dati.contoId,
      causale: dati.causale,
      categoriaRendiconto: dati.categoriaRendiconto,
      descrizione: dati.descrizione || null,
      controparteFornitore: dati.controparteFornitore || null,
      allegatoGiustificativoId: allegatoId ?? null,
      motivazioneAssenzaGiustificativo: haFile ? null : dati.motivazioneAssenzaGiustificativo || null,
      createdById: utente.id,
    },
  });

  await registraAudit({
    utenteId: utente.id,
    entita: "MovimentoPrimaNota",
    entitaId: movimentoId,
    azione: "creazione",
  });

  revalidatePath("/contabilita");
  return { successo: true };
}

export async function stornaMovimento(
  movimentoId: string,
  datiGrezzi: { motivoStorno: string }
): Promise<EsitoMovimento> {
  const utente = await richiediRuolo(["amministratore", "tesoriere"]);

  const risultato = schemaStorno.safeParse(datiGrezzi);
  if (!risultato.success) {
    return { errore: risultato.error.issues[0]?.message ?? "Motivo obbligatorio." };
  }

  const originale = await prisma.movimentoPrimaNota.findUnique({ where: { id: movimentoId } });
  if (!originale) return { errore: "Movimento non trovato." };
  if (originale.stornoDiId) return { errore: "Non è possibile stornare uno storno." };

  const giaStornato = await prisma.movimentoPrimaNota.findFirst({ where: { stornoDiId: movimentoId } });
  if (giaStornato) return { errore: "Questo movimento è già stato stornato." };

  const movimentoStorno = await prisma.movimentoPrimaNota.create({
    data: {
      data: new Date(),
      tipo: originale.tipo === "entrata" ? "uscita" : "entrata",
      importo: originale.importo,
      contoId: originale.contoId,
      causale: `Storno: ${originale.causale}`,
      categoriaRendiconto: originale.categoriaRendiconto,
      controparteId: originale.controparteId,
      controparteFornitore: originale.controparteFornitore,
      descrizione: originale.descrizione,
      stornoDiId: originale.id,
      motivoStorno: risultato.data.motivoStorno,
      createdById: utente.id,
    },
  });

  await registraAudit({
    utenteId: utente.id,
    entita: "MovimentoPrimaNota",
    entitaId: movimentoStorno.id,
    azione: "storno",
    diff: { stornoDiId: originale.id },
  });

  revalidatePath("/contabilita");
  return { successo: true };
}
