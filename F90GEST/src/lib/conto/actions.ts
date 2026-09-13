"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { richiediRuolo } from "@/lib/auth/richiedi-utente";
import { registraAudit } from "@/lib/audit";
import { schemaConto, type DatiConto } from "@/lib/validazioni/contabilita";

export type EsitoAzioneConto = { errore: string } | { successo: true };

export async function creaConto(datiGrezzi: DatiConto): Promise<EsitoAzioneConto> {
  const utente = await richiediRuolo(["amministratore", "tesoriere"]);

  const risultato = schemaConto.safeParse(datiGrezzi);
  if (!risultato.success) {
    return { errore: risultato.error.issues[0]?.message ?? "Dati non validi." };
  }
  const dati = risultato.data;

  const annoSocialeCorrente = await prisma.annoSociale.findFirst({
    where: { chiuso: false },
    orderBy: { dataInizio: "desc" },
  });
  if (!annoSocialeCorrente) {
    return { errore: "Nessun anno sociale aperto: crearne uno da Amministrazione prima di aggiungere un conto." };
  }

  const conto = await prisma.conto.create({
    data: {
      nome: dati.nome,
      tipo: dati.tipo,
      iban: dati.iban || null,
    },
  });

  await prisma.saldoContoAnno.create({
    data: {
      contoId: conto.id,
      annoSocialeId: annoSocialeCorrente.id,
      saldoIniziale: Number(dati.saldoIniziale),
    },
  });

  await registraAudit({
    utenteId: utente.id,
    entita: "Conto",
    entitaId: conto.id,
    azione: "creazione",
  });

  revalidatePath("/contabilita");
  return { successo: true };
}
