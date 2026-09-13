"use server";
import "server-only";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { richiediRuolo } from "@/lib/auth/richiedi-utente";
import { registraAudit } from "@/lib/audit";
import { salvaAllegato } from "@/lib/storage";
import {
  schemaRichiestaInteressato,
  schemaEvasioneRichiesta,
  type DatiRichiestaInteressato,
  type DatiEvasioneRichiesta,
} from "@/lib/validazioni/privacy";
import { costruisciEsportazionePersona } from "./esportazione";

const RUOLI_GESTIONE_PRIVACY = ["amministratore", "segreteria"] as const;

export async function registraRichiestaInteressato(
  datiGrezzi: DatiRichiestaInteressato
): Promise<{ errore: string } | { ok: true; richiestaId: string }> {
  const utente = await richiediRuolo([...RUOLI_GESTIONE_PRIVACY]);
  const risultato = schemaRichiestaInteressato.safeParse(datiGrezzi);
  if (!risultato.success) return { errore: risultato.error.issues[0].message };
  const dati = risultato.data;

  const richiesta = await prisma.richiestaInteressato.create({
    data: {
      personaId: dati.personaId,
      tipo: dati.tipo,
      dataRichiesta: new Date(dati.dataRichiesta),
    },
  });

  await registraAudit({ utenteId: utente.id, entita: "RichiestaInteressato", entitaId: richiesta.id, azione: "create" });
  revalidatePath("/privacy");
  return { ok: true, richiestaId: richiesta.id };
}

/**
 * Genera l'esportazione JSON dei dati della persona e la allega alla
 * richiesta (solo per tipo "accesso", §7.5/art. 15 GDPR). Riusa
 * `salvaAllegato`/la rotta generica di download allegati, come già fatto per
 * i documenti dell'archivio in M8, invece di creare un nuovo meccanismo di
 * file dedicato.
 */
export async function generaEsportazioneRichiesta(richiestaId: string): Promise<{ errore: string } | { ok: true }> {
  const utente = await richiediRuolo([...RUOLI_GESTIONE_PRIVACY]);
  const richiesta = await prisma.richiestaInteressato.findUnique({ where: { id: richiestaId } });
  if (!richiesta) return { errore: "Richiesta non trovata." };
  if (richiesta.tipo !== "accesso") return { errore: "L'esportazione è disponibile solo per le richieste di accesso." };

  const esportazione = await costruisciEsportazionePersona(richiesta.personaId);
  const buffer = Buffer.from(JSON.stringify(esportazione, null, 2), "utf-8");
  const allegato = await salvaAllegato({
    entitaTipo: "RichiestaInteressato",
    entitaId: richiestaId,
    nomeFileOriginale: `dati-personali-${richiesta.personaId}.json`,
    mimeType: "application/json",
    buffer,
    createdById: utente.id,
  });

  await prisma.richiestaInteressato.update({ where: { id: richiestaId }, data: { exportAllegatoId: allegato.id } });
  await registraAudit({ utenteId: utente.id, entita: "RichiestaInteressato", entitaId: richiestaId, azione: "esportazione" });
  revalidatePath("/privacy");
  return { ok: true };
}

/**
 * Registra l'esito di una richiesta (§7.5): testo libero, perché la
 * valutazione di come evadere una rettifica o cancellazione — specie in
 * presenza di obblighi di conservazione fiscale sui movimenti/ricevute
 * collegati — è una decisione che spetta all'associazione, non
 * un'automazione che il gestionale può prendere da solo (§12).
 */
export async function evadiRichiestaInteressato(
  richiestaId: string,
  datiGrezzi: DatiEvasioneRichiesta
): Promise<{ errore: string } | { ok: true }> {
  const utente = await richiediRuolo([...RUOLI_GESTIONE_PRIVACY]);
  const risultato = schemaEvasioneRichiesta.safeParse(datiGrezzi);
  if (!risultato.success) return { errore: risultato.error.issues[0].message };
  const richiesta = await prisma.richiestaInteressato.findUnique({ where: { id: richiestaId } });
  if (!richiesta) return { errore: "Richiesta non trovata." };

  await prisma.richiestaInteressato.update({
    where: { id: richiestaId },
    data: { esito: risultato.data.esito, dataEvasione: new Date() },
  });

  await registraAudit({ utenteId: utente.id, entita: "RichiestaInteressato", entitaId: richiestaId, azione: "evasione" });
  revalidatePath("/privacy");
  return { ok: true };
}
