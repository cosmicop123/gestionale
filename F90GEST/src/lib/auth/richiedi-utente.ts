import "server-only";
import { redirect } from "next/navigation";
import { ottieniUtenteCorrente, type UtenteSessione } from "./session";

/**
 * Da chiamare in ogni pagina/layout server e in ogni server action che
 * scrive dati: la sola assenza di un link/bottone in UI non basta come
 * controllo di autorizzazione (§8). Ogni operazione sensibile deve passare
 * da qui o da `richiediRuolo`.
 */
export async function richiediUtente(): Promise<UtenteSessione> {
  const utente = await ottieniUtenteCorrente();
  if (!utente) {
    redirect("/login");
  }
  return utente;
}

/**
 * Ruoli applicativi (§6 della specifica):
 * amministratore | segreteria | tesoriere | docente | sola_lettura
 */
export async function richiediRuolo(ruoliConsentiti: string[]): Promise<UtenteSessione> {
  const utente = await richiediUtente();
  if (!ruoliConsentiti.includes(utente.ruolo)) {
    redirect("/dashboard?errore=permessi");
  }
  return utente;
}
