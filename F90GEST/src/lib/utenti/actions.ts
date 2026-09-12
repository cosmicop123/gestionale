"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { richiediRuolo } from "@/lib/auth/richiedi-utente";
import { hashPassword } from "@/lib/auth/password";
import { invalidaTutteLeSessioni } from "@/lib/auth/session";
import { registraAudit } from "@/lib/audit";
import {
  schemaNuovoUtente,
  schemaModificaUtente,
  schemaResetPassword,
  type DatiNuovoUtente,
  type DatiModificaUtente,
} from "@/lib/validazioni/utente";

export type EsitoAzioneUtente = { errore: string } | { successo: true };

export async function creaUtente(datiGrezzi: DatiNuovoUtente): Promise<EsitoAzioneUtente> {
  const utenteCorrente = await richiediRuolo(["amministratore"]);

  const risultato = schemaNuovoUtente.safeParse(datiGrezzi);
  if (!risultato.success) {
    return { errore: risultato.error.issues[0]?.message ?? "Dati non validi." };
  }
  const dati = risultato.data;

  const passwordHash = await hashPassword(dati.password);

  try {
    const nuovoUtente = await prisma.utente.create({
      data: {
        email: dati.email.toLowerCase(),
        passwordHash,
        ruolo: dati.ruolo,
        createdById: utenteCorrente.id,
      },
    });
    await registraAudit({
      utenteId: utenteCorrente.id,
      entita: "Utente",
      entitaId: nuovoUtente.id,
      azione: "creazione",
      diff: { email: nuovoUtente.email, ruolo: nuovoUtente.ruolo },
    });
  } catch (errore) {
    if (errore instanceof Prisma.PrismaClientKnownRequestError && errore.code === "P2002") {
      return { errore: "Esiste già un utente con questa email." };
    }
    throw errore;
  }

  revalidatePath("/amministrazione");
  return { successo: true };
}

export async function modificaUtente(
  utenteId: string,
  datiGrezzi: DatiModificaUtente
): Promise<EsitoAzioneUtente> {
  const utenteCorrente = await richiediRuolo(["amministratore"]);

  const risultato = schemaModificaUtente.safeParse(datiGrezzi);
  if (!risultato.success) {
    return { errore: risultato.error.issues[0]?.message ?? "Dati non validi." };
  }
  const dati = risultato.data;

  const utenteTarget = await prisma.utente.findUnique({ where: { id: utenteId } });
  if (!utenteTarget) {
    return { errore: "Utente non trovato." };
  }

  const staRimuovendoUltimoAmministratore =
    utenteTarget.ruolo === "amministratore" &&
    utenteTarget.attivo &&
    (dati.ruolo !== "amministratore" || !dati.attivo);

  if (staRimuovendoUltimoAmministratore) {
    const altriAmministratoriAttivi = await prisma.utente.count({
      where: { ruolo: "amministratore", attivo: true, id: { not: utenteId } },
    });
    if (altriAmministratoriAttivi === 0) {
      return {
        errore: "Non è possibile: deve restare sempre almeno un amministratore attivo.",
      };
    }
  }

  await prisma.utente.update({
    where: { id: utenteId },
    data: { ruolo: dati.ruolo, attivo: dati.attivo },
  });

  if (!dati.attivo) {
    // La sospensione deve avere effetto immediato su ogni sessione aperta.
    await invalidaTutteLeSessioni(utenteId);
  }

  await registraAudit({
    utenteId: utenteCorrente.id,
    entita: "Utente",
    entitaId: utenteId,
    azione: "modifica",
    diff: { ruolo: dati.ruolo, attivo: dati.attivo },
  });

  revalidatePath("/amministrazione");
  return { successo: true };
}

export async function resettaPasswordUtente(
  utenteId: string,
  datiGrezzi: { password: string }
): Promise<EsitoAzioneUtente> {
  const utenteCorrente = await richiediRuolo(["amministratore"]);

  const risultato = schemaResetPassword.safeParse(datiGrezzi);
  if (!risultato.success) {
    return { errore: risultato.error.issues[0]?.message ?? "Password non valida." };
  }

  const utenteTarget = await prisma.utente.findUnique({ where: { id: utenteId } });
  if (!utenteTarget) {
    return { errore: "Utente non trovato." };
  }

  const passwordHash = await hashPassword(risultato.data.password);
  await prisma.utente.update({ where: { id: utenteId }, data: { passwordHash } });
  await invalidaTutteLeSessioni(utenteId);

  await registraAudit({
    utenteId: utenteCorrente.id,
    entita: "Utente",
    entitaId: utenteId,
    azione: "reset_password",
  });

  revalidatePath("/amministrazione");
  return { successo: true };
}
