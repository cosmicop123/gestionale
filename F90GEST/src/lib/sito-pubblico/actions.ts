"use server";
import "server-only";
import { revalidatePath } from "next/cache";
import { richiediRuolo } from "@/lib/auth/richiedi-utente";
import { registraAudit } from "@/lib/audit";
import { schemaConfigurazioneSitoPubblico, type DatiConfigurazioneSitoPubblico } from "@/lib/validazioni/sito-pubblico";
import { salvaParametriSitoPubblico } from "./parametri";

export async function salvaConfigurazioneSitoPubblico(
  datiGrezzi: DatiConfigurazioneSitoPubblico
): Promise<{ errore: string } | { ok: true }> {
  const utente = await richiediRuolo(["amministratore"]);
  const risultato = schemaConfigurazioneSitoPubblico.safeParse(datiGrezzi);
  if (!risultato.success) return { errore: risultato.error.issues[0].message };

  await salvaParametriSitoPubblico({
    presentazione: risultato.data.presentazione || "",
    urlBase: risultato.data.urlBase || "",
  });

  await registraAudit({ utenteId: utente.id, entita: "SitoPubblico", entitaId: "configurazione", azione: "update" });
  revalidatePath("/amministrazione");
  return { ok: true };
}
