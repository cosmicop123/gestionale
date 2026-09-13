"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { richiediRuolo } from "@/lib/auth/richiedi-utente";
import { registraAudit } from "@/lib/audit";
import {
  schemaGeneraQuota,
  schemaGeneraQuoteMassivo,
  type DatiGeneraQuota,
  type DatiGeneraQuoteMassivo,
} from "@/lib/validazioni/quota";

export type EsitoAzioneQuota =
  | { errore: string }
  | { successo: true; generate: number; saltate: { personaId: string; motivo: string }[] };

async function generaQuotaSingola(
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
  personaId: string,
  tipoQuotaId: string,
  scadenza: Date,
  utenteId: string
): Promise<{ ok: true } | { ok: false; motivo: string }> {
  const tipoQuota = await tx.tipoQuota.findUnique({ where: { id: tipoQuotaId } });
  if (!tipoQuota || tipoQuota.deletedAt) return { ok: false, motivo: "Tipo di quota non trovato." };

  const quotaEsistente = await tx.quota.findFirst({
    where: {
      personaId,
      tipoQuotaId,
      annoSocialeId: tipoQuota.annoSocialeId,
      deletedAt: null,
    },
  });
  if (quotaEsistente) return { ok: false, motivo: "Quota già generata per questo tipo e anno sociale." };

  await tx.quota.create({
    data: {
      personaId,
      tipoQuotaId,
      annoSocialeId: tipoQuota.annoSocialeId,
      importo: tipoQuota.importo,
      scadenza,
      stato: "da_pagare",
      naturaFiscale: tipoQuota.naturaFiscale,
      createdById: utenteId,
    },
  });
  return { ok: true };
}

export async function generaQuota(datiGrezzi: DatiGeneraQuota): Promise<EsitoAzioneQuota> {
  const utente = await richiediRuolo(["amministratore", "tesoriere"]);

  const risultato = schemaGeneraQuota.safeParse(datiGrezzi);
  if (!risultato.success) {
    return { errore: risultato.error.issues[0]?.message ?? "Dati non validi." };
  }
  const dati = risultato.data;

  const esito = await prisma.$transaction((tx) =>
    generaQuotaSingola(tx, dati.personaId, dati.tipoQuotaId, new Date(dati.scadenza), utente.id)
  );

  if (!esito.ok) {
    return { errore: esito.motivo };
  }

  await registraAudit({
    utenteId: utente.id,
    entita: "Quota",
    entitaId: dati.personaId,
    azione: "generazione",
  });

  revalidatePath(`/soci/${dati.personaId}`);
  revalidatePath("/contabilita");
  return { successo: true, generate: 1, saltate: [] };
}

export async function generaQuoteMassivo(datiGrezzi: DatiGeneraQuoteMassivo): Promise<EsitoAzioneQuota> {
  const utente = await richiediRuolo(["amministratore", "tesoriere"]);

  const risultato = schemaGeneraQuoteMassivo.safeParse(datiGrezzi);
  if (!risultato.success) {
    return { errore: risultato.error.issues[0]?.message ?? "Dati non validi." };
  }
  const dati = risultato.data;
  const scadenza = new Date(dati.scadenza);

  const saltate: { personaId: string; motivo: string }[] = [];
  let generate = 0;

  for (const personaId of dati.personaIds) {
    const esito = await prisma.$transaction((tx) =>
      generaQuotaSingola(tx, personaId, dati.tipoQuotaId, scadenza, utente.id)
    );
    if (esito.ok) {
      generate += 1;
    } else {
      saltate.push({ personaId, motivo: esito.motivo });
    }
  }

  await registraAudit({
    utenteId: utente.id,
    entita: "Quota",
    entitaId: "generazione-massiva",
    azione: "generazione_massiva",
    diff: { generate, saltate: saltate.length },
  });

  revalidatePath("/contabilita");
  return { successo: true, generate, saltate };
}
