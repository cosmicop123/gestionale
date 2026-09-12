"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { distruggiSessioneCorrente, ottieniUtenteCorrente } from "./session";
import { registraAudit } from "@/lib/audit";

export async function esci(): Promise<void> {
  const utente = await ottieniUtenteCorrente();
  await distruggiSessioneCorrente();
  if (utente) {
    const elencoHeader = await headers();
    const ip = elencoHeader.get("x-forwarded-for") ?? elencoHeader.get("x-real-ip") ?? null;
    await registraAudit({
      utenteId: utente.id,
      entita: "Utente",
      entitaId: utente.id,
      azione: "logout",
      ip,
    });
  }
  redirect("/login");
}
