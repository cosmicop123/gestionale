import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { randomBytes, createHash } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { NOME_COOKIE_SESSIONE as NOME_COOKIE } from "./cookie-nome";

// Sessioni in DB (pattern "Lucia-style" senza la libreria Lucia, ormai in
// modalità solo-guida): il cookie contiene un token casuale in chiaro, il
// DB memorizza solo il suo hash SHA-256. Così un dump del database non
// permette di impersonare le sessioni attive, e la sospensione di un
// utente invalida immediatamente ogni sua sessione (basta cancellare le
// righe collegate, senza dover attendere la scadenza di un JWT).
const DURATA_SESSIONE_MS = 1000 * 60 * 60 * 24 * 14; // 14 giorni
const SOGLIA_RINNOVO_MS = 1000 * 60 * 60 * 24 * 7; // rinnova se restano meno di 7 giorni

function generaToken(): string {
  return randomBytes(20).toString("base64url");
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export type UtenteSessione = {
  id: string;
  email: string;
  ruolo: string;
  attivo: boolean;
  personaId: string | null;
};

export async function creaSessione(
  utenteId: string,
  contesto: { ip?: string | null; userAgent?: string | null }
): Promise<void> {
  const token = generaToken();
  const id = hashToken(token);
  const scadenza = new Date(Date.now() + DURATA_SESSIONE_MS);

  await prisma.sessione.create({
    data: {
      id,
      utenteId,
      scadenza,
      ipCreazione: contesto.ip ?? null,
      userAgent: contesto.userAgent ?? null,
    },
  });

  const store = await cookies();
  store.set(NOME_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: scadenza,
    path: "/",
  });
}

export async function distruggiSessioneCorrente(): Promise<void> {
  const store = await cookies();
  const token = store.get(NOME_COOKIE)?.value;
  store.delete(NOME_COOKIE);
  if (!token) return;

  const id = hashToken(token);
  await prisma.sessione.delete({ where: { id } }).catch(() => {
    // sessione già scaduta/rimossa: nessun problema
  });
}

export async function invalidaTutteLeSessioni(utenteId: string): Promise<void> {
  await prisma.sessione.deleteMany({ where: { utenteId } });
}

/**
 * Valida la sessione corrente contro il database (verifica reale, non solo
 * la presenza del cookie). Da usare in layout/pagine server e server
 * actions quando serve conoscere l'utente autenticato. Rinnova la scadenza
 * se prossima e restituisce null se assente/scaduta/utente sospeso.
 */
// `cache()` deduplica le chiamate all'interno della stessa richiesta: senza
// questo, layout + pagina finirebbero per interrogare due volte il DB (ed
// eventualmente rinnovare due volte la scadenza) per la stessa richiesta.
export const ottieniUtenteCorrente = cache(async (): Promise<UtenteSessione | null> => {
  const store = await cookies();
  const token = store.get(NOME_COOKIE)?.value;
  if (!token) return null;

  const id = hashToken(token);
  const sessione = await prisma.sessione.findUnique({
    where: { id },
    include: { utente: true },
  });

  if (!sessione) return null;

  if (sessione.scadenza.getTime() < Date.now()) {
    await prisma.sessione.delete({ where: { id } }).catch(() => {});
    return null;
  }

  if (!sessione.utente.attivo || sessione.utente.deletedAt) {
    await prisma.sessione.delete({ where: { id } }).catch(() => {});
    return null;
  }

  const scadenzaRimanente = sessione.scadenza.getTime() - Date.now();
  if (scadenzaRimanente < SOGLIA_RINNOVO_MS) {
    const nuovaScadenza = new Date(Date.now() + DURATA_SESSIONE_MS);
    await prisma.sessione.update({
      where: { id },
      data: { scadenza: nuovaScadenza },
    });
    store.set(NOME_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      expires: nuovaScadenza,
      path: "/",
    });
  }

  return {
    id: sessione.utente.id,
    email: sessione.utente.email,
    ruolo: sessione.utente.ruolo,
    attivo: sessione.utente.attivo,
    personaId: sessione.utente.personaId,
  };
});

export const NOME_COOKIE_SESSIONE = NOME_COOKIE;
