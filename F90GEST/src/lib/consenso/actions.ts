"use server";
import "server-only";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { richiediRuolo } from "@/lib/auth/richiedi-utente";
import { registraAudit } from "@/lib/audit";
import { schemaRevocaConsenso, type DatiRevocaConsenso } from "@/lib/validazioni/privacy";

const RUOLI_GESTIONE_PRIVACY = ["amministratore", "segreteria"] as const;

const TIPI_CONSENSO = [
  "trattamento_finalita_associative",
  "immagini_video",
  "newsletter_promozionale",
  "comunicazione_terzi",
] as const;

/**
 * Stato corrente dei consensi di una persona: per ciascun tipo, la riga più
 * recente (i consensi sono append-only, §7.5) — `null` se non è mai stato
 * registrato nulla per quel tipo.
 */
export async function ottieniConsensiPersona(personaId: string) {
  await richiediRuolo([...RUOLI_GESTIONE_PRIVACY]);
  const consensi = await prisma.consenso.findMany({ where: { personaId }, orderBy: { data: "desc" } });

  return TIPI_CONSENSO.map((tipo) => ({
    tipo,
    ultimo: consensi.find((c) => c.tipo === tipo) ?? null,
  }));
}

/**
 * I consensi sono append-only, come l'informativa cui si riferiscono (§7.5):
 * revocare un consenso non aggiorna la riga esistente ma ne crea una nuova
 * con stato "revocato", riferita all'ultima informativa pubblicata. Lo stato
 * corrente di un consenso è sempre la riga più recente per (persona, tipo).
 */
export async function revocaConsenso(datiGrezzi: DatiRevocaConsenso): Promise<{ errore: string } | { ok: true }> {
  const utente = await richiediRuolo([...RUOLI_GESTIONE_PRIVACY]);
  const risultato = schemaRevocaConsenso.safeParse(datiGrezzi);
  if (!risultato.success) return { errore: risultato.error.issues[0].message };
  const dati = risultato.data;

  const informativaCorrente = await prisma.informativa.findFirst({ orderBy: { dataPubblicazione: "desc" } });
  if (!informativaCorrente) return { errore: "Nessuna informativa privacy pubblicata: impossibile registrare il consenso." };

  const consenso = await prisma.consenso.create({
    data: {
      personaId: dati.personaId,
      informativaId: informativaCorrente.id,
      tipo: dati.tipo,
      stato: "revocato",
      data: new Date(),
      modalita: dati.modalita,
    },
  });

  await registraAudit({
    utenteId: utente.id,
    entita: "Consenso",
    entitaId: consenso.id,
    azione: "revoca",
    diff: { personaId: dati.personaId, tipo: dati.tipo },
  });
  revalidatePath("/privacy");
  return { ok: true };
}
