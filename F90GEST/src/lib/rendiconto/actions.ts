"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { richiediRuolo } from "@/lib/auth/richiedi-utente";
import { registraAudit } from "@/lib/audit";
import {
  schemaMappaturaRendiconto,
  CATEGORIE_RENDICONTO_ENTRATA,
  CATEGORIE_RENDICONTO_USCITA,
  type DatiMappaturaRendiconto,
} from "@/lib/validazioni/contabilita";

export type EsitoAzione = { errore: string } | { successo: true };

const RUOLI_GESTIONE_RENDICONTO = ["amministratore", "tesoriere"];

/**
 * Aggiorna la mappatura categoria di prima nota → sezione A-E del
 * rendiconto per cassa. Resta una scelta dell'associazione (§12): qui si
 * valida solo che ogni categoria nota abbia una sezione assegnata tra le
 * 5 previste dal Mod. D, non la correttezza fiscale della scelta.
 */
export async function aggiornaMappaturaRendiconto(datiGrezzi: DatiMappaturaRendiconto): Promise<EsitoAzione> {
  const utente = await richiediRuolo(RUOLI_GESTIONE_RENDICONTO);

  const tutteLeCategorie = [...CATEGORIE_RENDICONTO_ENTRATA, ...CATEGORIE_RENDICONTO_USCITA];
  const risultato = schemaMappaturaRendiconto.safeParse(datiGrezzi);
  if (!risultato.success) {
    return { errore: risultato.error.issues[0]?.message ?? "Dati non validi." };
  }
  const mancanti = tutteLeCategorie.filter((c) => !(c in risultato.data));
  if (mancanti.length > 0) {
    return { errore: `Manca la sezione per: ${mancanti.join(", ")}.` };
  }

  await prisma.parametro.update({
    where: { chiave: "contabilita.mappatura_categorie_rendiconto" },
    data: { valore: JSON.stringify(risultato.data) },
  });

  await registraAudit({
    utenteId: utente.id,
    entita: "Parametro",
    entitaId: "contabilita.mappatura_categorie_rendiconto",
    azione: "modifica",
  });

  revalidatePath("/contabilita");
  return { successo: true };
}

export async function impostaFormaRendiconto(formaAggregata: boolean): Promise<EsitoAzione> {
  const utente = await richiediRuolo(RUOLI_GESTIONE_RENDICONTO);

  await prisma.parametro.update({
    where: { chiave: "contabilita.rendiconto_forma_aggregata" },
    data: { valore: formaAggregata ? "true" : "false" },
  });

  await registraAudit({
    utenteId: utente.id,
    entita: "Parametro",
    entitaId: "contabilita.rendiconto_forma_aggregata",
    azione: "modifica",
    diff: { formaAggregata },
  });

  revalidatePath("/contabilita");
  return { successo: true };
}
