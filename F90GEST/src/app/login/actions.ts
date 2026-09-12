"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/auth/password";
import { creaSessione } from "@/lib/auth/session";
import { verificaELimitaTentativi, azzeraTentativi } from "@/lib/auth/rate-limit";
import { registraAudit } from "@/lib/audit";
import { schemaAccesso, type DatiAccesso } from "@/lib/validazioni/autenticazione";

export type EsitoAccesso = { errore: string } | { successo: true };

export async function accedi(datiGrezzi: DatiAccesso): Promise<EsitoAccesso> {
  const risultatoValidazione = schemaAccesso.safeParse(datiGrezzi);
  if (!risultatoValidazione.success) {
    return { errore: "Email o password non validi." };
  }
  const { email, password } = risultatoValidazione.data;

  const elencoHeader = await headers();
  const ip = elencoHeader.get("x-forwarded-for") ?? elencoHeader.get("x-real-ip") ?? "sconosciuto";
  const userAgent = elencoHeader.get("user-agent");

  // Rate limiting per IP+email: evita sia il bruteforce su un singolo
  // account sia lo spam di tentativi da un singolo indirizzo (§8).
  const chiaveLimite = `${ip}:${email.toLowerCase()}`;
  const esitoLimite = verificaELimitaTentativi(chiaveLimite);
  if (!esitoLimite.consentito) {
    return {
      errore: `Troppi tentativi di accesso. Riprova tra ${Math.ceil((esitoLimite.riprovaTraSecondi ?? 60) / 60)} minuti.`,
    };
  }

  const utente = await prisma.utente.findUnique({ where: { email: email.toLowerCase() } });

  // Messaggio identico per email inesistente/password errata/utente sospeso:
  // non rivelare quale delle tre condizioni si è verificata.
  const credenzialiNonValide = { errore: "Email o password non corretti." };

  if (!utente || utente.deletedAt || !utente.attivo) {
    return credenzialiNonValide;
  }

  const passwordValida = await verifyPassword(utente.passwordHash, password);
  if (!passwordValida) {
    await registraAudit({
      utenteId: utente.id,
      entita: "Utente",
      entitaId: utente.id,
      azione: "login_fallito",
      ip,
    });
    return credenzialiNonValide;
  }

  azzeraTentativi(chiaveLimite);
  await creaSessione(utente.id, { ip, userAgent });
  await prisma.utente.update({
    where: { id: utente.id },
    data: { ultimoAccesso: new Date() },
  });
  await registraAudit({
    utenteId: utente.id,
    entita: "Utente",
    entitaId: utente.id,
    azione: "login",
    ip,
  });

  const associazione = await prisma.associazione.findFirst();
  if (utente.ruolo === "amministratore" && associazione && !associazione.configurazioneCompletata) {
    redirect("/onboarding");
  }
  redirect("/dashboard");
}
