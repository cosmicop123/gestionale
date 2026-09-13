"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { richiediRuolo } from "@/lib/auth/richiedi-utente";
import { registraAudit } from "@/lib/audit";
import { schemaTipoQuota, type DatiTipoQuota } from "@/lib/validazioni/contabilita";

export type EsitoAzioneTipoQuota = { errore: string } | { successo: true };

export async function creaTipoQuota(datiGrezzi: DatiTipoQuota): Promise<EsitoAzioneTipoQuota> {
  const utente = await richiediRuolo(["amministratore", "tesoriere"]);

  const risultato = schemaTipoQuota.safeParse(datiGrezzi);
  if (!risultato.success) {
    return { errore: risultato.error.issues[0]?.message ?? "Dati non validi." };
  }
  const dati = risultato.data;

  const annoSocialeCorrente = await prisma.annoSociale.findFirst({
    where: { chiuso: false },
    orderBy: { dataInizio: "desc" },
  });
  if (!annoSocialeCorrente) {
    return { errore: "Nessun anno sociale aperto." };
  }

  const tipoQuota = await prisma.tipoQuota.create({
    data: {
      descrizione: dati.descrizione,
      importo: Number(dati.importo),
      annoSocialeId: annoSocialeCorrente.id,
      categoriaSocioApplicabile: dati.categoriaSocioApplicabile || null,
      naturaFiscale: dati.naturaFiscale,
      ricorrente: dati.ricorrente,
      createdById: utente.id,
    },
  });

  await registraAudit({
    utenteId: utente.id,
    entita: "TipoQuota",
    entitaId: tipoQuota.id,
    azione: "creazione",
  });

  revalidatePath("/contabilita");
  return { successo: true };
}
