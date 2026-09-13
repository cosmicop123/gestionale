"use server";
import "server-only";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { richiediRuolo } from "@/lib/auth/richiedi-utente";
import { registraAudit } from "@/lib/audit";
import { schemaRegistroTrattamento, type DatiRegistroTrattamento } from "@/lib/validazioni/privacy";

const RUOLI_GESTIONE_PRIVACY = ["amministratore", "segreteria"] as const;

export async function creaTrattamento(datiGrezzi: DatiRegistroTrattamento): Promise<{ errore: string } | { ok: true }> {
  const utente = await richiediRuolo([...RUOLI_GESTIONE_PRIVACY]);
  const risultato = schemaRegistroTrattamento.safeParse(datiGrezzi);
  if (!risultato.success) return { errore: risultato.error.issues[0].message };
  const dati = risultato.data;

  const trattamento = await prisma.registroTrattamenti.create({
    data: {
      nomeTrattamento: dati.nomeTrattamento,
      finalita: dati.finalita,
      baseGiuridica: dati.baseGiuridica,
      categorieDati: dati.categorieDati,
      categorieInteressati: dati.categorieInteressati,
      destinatari: dati.destinatari || null,
      tempiConservazione: dati.tempiConservazione,
      misureSicurezza: dati.misureSicurezza,
    },
  });

  await registraAudit({ utenteId: utente.id, entita: "RegistroTrattamenti", entitaId: trattamento.id, azione: "create" });
  revalidatePath("/privacy");
  return { ok: true };
}

export async function modificaTrattamento(
  trattamentoId: string,
  datiGrezzi: DatiRegistroTrattamento
): Promise<{ errore: string } | { ok: true }> {
  const utente = await richiediRuolo([...RUOLI_GESTIONE_PRIVACY]);
  const risultato = schemaRegistroTrattamento.safeParse(datiGrezzi);
  if (!risultato.success) return { errore: risultato.error.issues[0].message };
  const dati = risultato.data;

  const esistente = await prisma.registroTrattamenti.findUnique({ where: { id: trattamentoId } });
  if (!esistente) return { errore: "Trattamento non trovato." };

  await prisma.registroTrattamenti.update({
    where: { id: trattamentoId },
    data: {
      nomeTrattamento: dati.nomeTrattamento,
      finalita: dati.finalita,
      baseGiuridica: dati.baseGiuridica,
      categorieDati: dati.categorieDati,
      categorieInteressati: dati.categorieInteressati,
      destinatari: dati.destinatari || null,
      tempiConservazione: dati.tempiConservazione,
      misureSicurezza: dati.misureSicurezza,
    },
  });

  await registraAudit({ utenteId: utente.id, entita: "RegistroTrattamenti", entitaId: trattamentoId, azione: "update" });
  revalidatePath("/privacy");
  return { ok: true };
}

export async function eliminaTrattamento(trattamentoId: string): Promise<{ errore: string } | { ok: true }> {
  const utente = await richiediRuolo([...RUOLI_GESTIONE_PRIVACY]);
  const esistente = await prisma.registroTrattamenti.findUnique({ where: { id: trattamentoId } });
  if (!esistente) return { errore: "Trattamento non trovato." };

  await prisma.registroTrattamenti.delete({ where: { id: trattamentoId } });
  await registraAudit({ utenteId: utente.id, entita: "RegistroTrattamenti", entitaId: trattamentoId, azione: "delete" });
  revalidatePath("/privacy");
  return { ok: true };
}
