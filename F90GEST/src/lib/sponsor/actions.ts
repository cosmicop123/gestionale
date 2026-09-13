"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { richiediRuolo } from "@/lib/auth/richiedi-utente";
import { registraAudit } from "@/lib/audit";
import {
  schemaSponsorContributo,
  schemaIncassoSponsor,
  STATI_SPONSOR,
  type DatiSponsorContributo,
  type DatiIncassoSponsor,
} from "@/lib/validazioni/evento";

export type EsitoAzione = { errore: string } | { successo: true };

const RUOLI_GESTIONE_EVENTI = ["amministratore", "segreteria"];
const RUOLI_GESTIONE_INCASSI = ["amministratore", "segreteria", "tesoriere"];

const CATEGORIA_DA_TIPO_SPONSOR: Record<string, string> = {
  sponsorizzazione: "sponsorizzazioni",
  erogazione_liberale: "erogazioni_liberali",
  contributo_pubblico: "contributi_pubblici",
};

export async function creaSponsorContributo(datiGrezzi: DatiSponsorContributo): Promise<EsitoAzione> {
  const utente = await richiediRuolo(RUOLI_GESTIONE_EVENTI);

  const risultato = schemaSponsorContributo.safeParse(datiGrezzi);
  if (!risultato.success) {
    return { errore: risultato.error.issues[0]?.message ?? "Dati non validi." };
  }
  const dati = risultato.data;

  const sponsor = await prisma.sponsorContributo.create({
    data: {
      soggettoId: dati.soggettoId || null,
      soggettoLibero: dati.soggettoId ? null : dati.soggettoLibero || null,
      tipo: dati.tipo,
      importo: Number(dati.importo),
      data: new Date(dati.data),
      eventoId: dati.eventoId || null,
      raccoltaFondiId: dati.raccoltaFondiId || null,
      createdById: utente.id,
    },
  });

  await registraAudit({ utenteId: utente.id, entita: "SponsorContributo", entitaId: sponsor.id, azione: "creazione" });

  if (dati.eventoId) revalidatePath(`/eventi/${dati.eventoId}`);
  if (dati.raccoltaFondiId) revalidatePath(`/eventi/raccolte-fondi/${dati.raccoltaFondiId}`);
  revalidatePath("/eventi/sponsor");
  return { successo: true };
}

export async function cambiaStatoSponsor(
  sponsorId: string,
  stato: (typeof STATI_SPONSOR)[number]
): Promise<EsitoAzione> {
  const utente = await richiediRuolo(RUOLI_GESTIONE_EVENTI);

  if (!STATI_SPONSOR.includes(stato)) return { errore: "Stato non valido." };

  const sponsor = await prisma.sponsorContributo.findUnique({ where: { id: sponsorId } });
  if (!sponsor || sponsor.deletedAt) return { errore: "Contributo non trovato." };
  if (sponsor.stato === "incassato") return { errore: "Questo contributo risulta già incassato." };

  await prisma.sponsorContributo.update({ where: { id: sponsorId }, data: { stato } });

  await registraAudit({
    utenteId: utente.id,
    entita: "SponsorContributo",
    entitaId: sponsorId,
    azione: "cambio_stato",
    diff: { stato },
  });

  if (sponsor.eventoId) revalidatePath(`/eventi/${sponsor.eventoId}`);
  if (sponsor.raccoltaFondiId) revalidatePath(`/eventi/raccolte-fondi/${sponsor.raccoltaFondiId}`);
  revalidatePath("/eventi/sponsor");
  return { successo: true };
}

/**
 * Segna un contributo come incassato e registra in un'unica transazione il
 * movimento di prima nota collegato (stesso principio del pagamento quota
 * di M3: mai un doppio inserimento manuale).
 */
export async function incassaSponsor(sponsorId: string, datiGrezzi: DatiIncassoSponsor): Promise<EsitoAzione> {
  const utente = await richiediRuolo(RUOLI_GESTIONE_INCASSI);

  const risultato = schemaIncassoSponsor.safeParse(datiGrezzi);
  if (!risultato.success) {
    return { errore: risultato.error.issues[0]?.message ?? "Dati non validi." };
  }

  const sponsor = await prisma.sponsorContributo.findUnique({ where: { id: sponsorId } });
  if (!sponsor || sponsor.deletedAt) return { errore: "Contributo non trovato." };
  if (sponsor.stato === "incassato") return { errore: "Questo contributo risulta già incassato." };
  if (sponsor.stato === "rifiutato") return { errore: "Questo contributo è stato rifiutato." };

  await prisma.$transaction(async (tx) => {
    await tx.sponsorContributo.update({ where: { id: sponsorId }, data: { stato: "incassato" } });

    await tx.movimentoPrimaNota.create({
      data: {
        data: sponsor.data,
        tipo: "entrata",
        importo: sponsor.importo,
        contoId: risultato.data.contoId,
        causale: `${sponsor.tipo === "sponsorizzazione" ? "Sponsorizzazione" : sponsor.tipo === "erogazione_liberale" ? "Erogazione liberale" : "Contributo pubblico"} — ${sponsor.soggettoLibero ?? ""}`.trim(),
        categoriaRendiconto: CATEGORIA_DA_TIPO_SPONSOR[sponsor.tipo] ?? "altre_entrate",
        controparteId: sponsor.soggettoId,
        eventoId: sponsor.eventoId,
        raccoltaFondiId: sponsor.raccoltaFondiId,
        createdById: utente.id,
      },
    });
  });

  await registraAudit({ utenteId: utente.id, entita: "SponsorContributo", entitaId: sponsorId, azione: "incasso" });

  if (sponsor.eventoId) revalidatePath(`/eventi/${sponsor.eventoId}`);
  if (sponsor.raccoltaFondiId) revalidatePath(`/eventi/raccolte-fondi/${sponsor.raccoltaFondiId}`);
  revalidatePath("/eventi/sponsor");
  revalidatePath("/contabilita");
  return { successo: true };
}
