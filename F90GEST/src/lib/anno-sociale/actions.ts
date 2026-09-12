"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { richiediRuolo } from "@/lib/auth/richiedi-utente";
import { registraAudit } from "@/lib/audit";
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

  await registraAudit({
    utenteId: utente.id,
    entita: "AnnoSociale",
    entitaId: nuovoAnno.id,
    azione: "creazione",
  });

  revalidatePath("/amministrazione");
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
