"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { richiediRuolo } from "@/lib/auth/richiedi-utente";
import { registraAudit } from "@/lib/audit";
import { calcolaSaldoConto } from "@/lib/contabilita/saldo";
import { schemaAnnoSociale, type DatiAnnoSociale } from "@/lib/validazioni/anno-sociale";

export type EsitoAzioneAnnoSociale = { errore: string } | { successo: true };

export async function creaAnnoSociale(datiGrezzi: DatiAnnoSociale): Promise<EsitoAzioneAnnoSociale> {
  const utente = await richiediRuolo(["amministratore"]);

  const risultato = schemaAnnoSociale.safeParse(datiGrezzi);
  if (!risultato.success) {
    return { errore: risultato.error.issues[0]?.message ?? "Dati non validi." };
  }
  const dati = risultato.data;

  const esistente = await prisma.annoSociale.findUnique({ where: { etichetta: dati.etichetta } });
  if (esistente) {
    return { errore: `Esiste già un anno sociale con etichetta "${dati.etichetta}".` };
  }

  const nuovoAnno = await prisma.annoSociale.create({
    data: {
      etichetta: dati.etichetta,
      dataInizio: new Date(dati.dataInizio),
      dataFine: new Date(dati.dataFine),
      createdById: utente.id,
    },
  });

  // Riporto automatico del saldo (§7.2): per ogni conto esistente, se
  // l'anno sociale precedente è chiuso e ha un saldo finale calcolato, il
  // saldo iniziale del nuovo anno lo riprende automaticamente — non è mai
  // l'operatore a doverlo reinserire a mano.
  const conti = await prisma.conto.findMany({ where: { deletedAt: null } });
  for (const conto of conti) {
    const saldoAnnoPrecedente = await prisma.saldoContoAnno.findFirst({
      where: { contoId: conto.id, saldoFinale: { not: null }, annoSociale: { chiuso: true } },
      orderBy: { annoSociale: { dataFine: "desc" } },
    });
    if (saldoAnnoPrecedente?.saldoFinale != null) {
      await prisma.saldoContoAnno.create({
        data: {
          contoId: conto.id,
          annoSocialeId: nuovoAnno.id,
          saldoIniziale: saldoAnnoPrecedente.saldoFinale,
        },
      });
    }
  }

  await registraAudit({
    utenteId: utente.id,
    entita: "AnnoSociale",
    entitaId: nuovoAnno.id,
    azione: "creazione",
  });

  revalidatePath("/amministrazione");
  revalidatePath("/contabilita");
  return { successo: true };
}

export async function chiudiAnnoSociale(annoSocialeId: string): Promise<EsitoAzioneAnnoSociale> {
  const utente = await richiediRuolo(["amministratore"]);

  const anno = await prisma.annoSociale.findUnique({ where: { id: annoSocialeId } });
  if (!anno) {
    return { errore: "Anno sociale non trovato." };
  }
  if (anno.chiuso) {
    return { errore: "L'anno sociale è già chiuso." };
  }

  // Calcola e blocca il saldo finale di ogni conto per questo anno (§7.2):
  // da qui in poi il saldo iniziale del prossimo anno lo riprenderà
  // automaticamente (vedi `creaAnnoSociale`), senza reinserimento manuale.
  const saldiAnno = await prisma.saldoContoAnno.findMany({ where: { annoSocialeId } });
  for (const saldoConto of saldiAnno) {
    const movimenti = await prisma.movimentoPrimaNota.findMany({
      where: {
        contoId: saldoConto.contoId,
        data: { gte: anno.dataInizio, lte: anno.dataFine },
      },
      select: { tipo: true, importo: true },
    });
    const saldoFinale = calcolaSaldoConto(
      Number(saldoConto.saldoIniziale),
      movimenti.map((m) => ({ tipo: m.tipo, importo: Number(m.importo) }))
    );
    await prisma.saldoContoAnno.update({
      where: { id: saldoConto.id },
      data: { saldoFinale },
    });
  }

  await prisma.annoSociale.update({
    where: { id: annoSocialeId },
    data: { chiuso: true, dataChiusura: new Date() },
  });

  await registraAudit({
    utenteId: utente.id,
    entita: "AnnoSociale",
    entitaId: annoSocialeId,
    azione: "chiusura",
  });

  revalidatePath("/amministrazione");
  return { successo: true };
}
