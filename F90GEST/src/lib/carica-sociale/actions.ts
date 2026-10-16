"use server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { richiediRuolo } from "@/lib/auth/richiedi-utente";
import { registraAudit } from "@/lib/audit";
import {
  schemaNominaCaricaSociale,
  schemaTerminaMandatoCaricaSociale,
  RUOLI_CARICA_UNICA,
  type DatiNominaCaricaSociale,
  type DatiTerminaMandatoCaricaSociale,
} from "@/lib/validazioni/carica-sociale";

/**
 * Assegna una carica sociale (Presidente/Vicepresidente/Segretario/
 * Tesoriere/Consigliere) a una persona già censita. Per i ruoli "unici"
 * (tutti tranne Consigliere, che per sua natura può essere più di uno
 * contemporaneamente) chiude automaticamente il mandato del titolare
 * attuale alla data di inizio del nuovo, invece di lasciare due titolari
 * attivi per lo stesso ruolo — mai un update del titolare precedente
 * (CaricaSociale resta uno storico per-riga, stesso principio già seguito
 * per SocioStato).
 */
export async function nominaCaricaSociale(
  datiGrezzi: DatiNominaCaricaSociale
): Promise<{ errore: string } | { ok: true }> {
  const utente = await richiediRuolo(["amministratore"]);
  const risultato = schemaNominaCaricaSociale.safeParse(datiGrezzi);
  if (!risultato.success) return { errore: risultato.error.issues[0].message };
  const dati = risultato.data;

  const persona = await prisma.persona.findUnique({ where: { id: dati.personaId } });
  if (!persona || persona.deletedAt) return { errore: "Persona non trovata." };

  const dataInizioMandato = new Date(dati.dataInizioMandato);

  await prisma.$transaction(async (tx) => {
    if ((RUOLI_CARICA_UNICA as readonly string[]).includes(dati.ruolo)) {
      await tx.caricaSociale.updateMany({
        where: { ruolo: dati.ruolo, dataFineMandato: null, deletedAt: null },
        data: { dataFineMandato: dataInizioMandato },
      });
    }

    await tx.caricaSociale.create({
      data: {
        personaId: dati.personaId,
        ruolo: dati.ruolo,
        dataInizioMandato,
        estremiVerbaleNomina: dati.estremiVerbaleNomina || null,
        createdById: utente.id,
      },
    });
  });

  await registraAudit({ utenteId: utente.id, entita: "CaricaSociale", entitaId: dati.personaId, azione: "nomina", diff: { ruolo: dati.ruolo } });
  revalidatePath("/amministrazione");
  return { ok: true };
}

export async function terminaMandatoCaricaSociale(
  caricaId: string,
  datiGrezzi: DatiTerminaMandatoCaricaSociale
): Promise<{ errore: string } | { ok: true }> {
  const utente = await richiediRuolo(["amministratore"]);
  const risultato = schemaTerminaMandatoCaricaSociale.safeParse(datiGrezzi);
  if (!risultato.success) return { errore: risultato.error.issues[0].message };

  const carica = await prisma.caricaSociale.findUnique({ where: { id: caricaId } });
  if (!carica || carica.deletedAt) return { errore: "Carica non trovata." };
  if (carica.dataFineMandato) return { errore: "Il mandato è già terminato." };

  await prisma.caricaSociale.update({
    where: { id: caricaId },
    data: { dataFineMandato: new Date(risultato.data.dataFineMandato) },
  });

  await registraAudit({ utenteId: utente.id, entita: "CaricaSociale", entitaId: caricaId, azione: "termina_mandato" });
  revalidatePath("/amministrazione");
  return { ok: true };
}

/**
 * Cancellazione logica di una riga inserita per errore (es. persona o
 * ruolo sbagliati al momento della nomina) — diversa da "termina mandato",
 * che registra un evento reale (fine del mandato). Non impostata come
 * append-only rigida in CLAUDE.md (a differenza di Socio/SocioStato): qui
 * una correzione d'inserimento è legittima, ma resta una cancellazione
 * logica (deletedAt), mai una delete reale, per non perdere traccia di cosa
 * è stato corretto.
 */
export async function eliminaCaricaSociale(caricaId: string): Promise<{ errore: string } | { ok: true }> {
  const utente = await richiediRuolo(["amministratore"]);
  const carica = await prisma.caricaSociale.findUnique({ where: { id: caricaId } });
  if (!carica || carica.deletedAt) return { errore: "Carica non trovata." };

  await prisma.caricaSociale.update({ where: { id: caricaId }, data: { deletedAt: new Date() } });
  await registraAudit({ utenteId: utente.id, entita: "CaricaSociale", entitaId: caricaId, azione: "elimina" });
  revalidatePath("/amministrazione");
  return { ok: true };
}
