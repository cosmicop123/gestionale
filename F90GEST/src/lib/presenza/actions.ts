"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { richiediRuolo } from "@/lib/auth/richiedi-utente";
import { registraAudit } from "@/lib/audit";
import { schemaPresenza, type DatiPresenza } from "@/lib/validazioni/corso";

export type EsitoRegistraPresenza = { errore: string } | { successo: true; nomeCognome: string };

const RUOLI_APPELLO = ["amministratore", "segreteria", "docente"];

async function verificaAccessoLezione(
  lezioneId: string,
  utente: { ruolo: string; personaId: string | null }
): Promise<{ errore: string } | { corsoId: string }> {
  const lezione = await prisma.lezione.findUnique({ where: { id: lezioneId } });
  if (!lezione || lezione.deletedAt) return { errore: "Lezione non trovata." };

  if (utente.ruolo === "docente") {
    const assegnato = await prisma.corsoDocente.findFirst({
      where: { corsoId: lezione.corsoId, personaId: utente.personaId ?? "" },
    });
    if (!assegnato) return { errore: "Non sei docente di questo corso." };
  }

  return { corsoId: lezione.corsoId };
}

/**
 * Registra (o aggiorna) la presenza di un'iscrizione a una lezione, con
 * salvataggio immediato riga per riga (§6 M4, "appello mobile con
 * salvataggio immediato"). Funziona sia per l'appello manuale sia per il
 * check-in tramite scansione QR (stesso vincolo di unicità lezione+iscrizione
 * del §5.4, quindi un nuovo invio sovrascrive semplicemente lo stato
 * precedente anziché duplicare la riga).
 */
export async function registraPresenza(
  lezioneId: string,
  datiGrezzi: DatiPresenza
): Promise<EsitoRegistraPresenza> {
  const utente = await richiediRuolo(RUOLI_APPELLO);

  const risultato = schemaPresenza.safeParse(datiGrezzi);
  if (!risultato.success) {
    return { errore: risultato.error.issues[0]?.message ?? "Dati non validi." };
  }
  const dati = risultato.data;

  const accesso = await verificaAccessoLezione(lezioneId, utente);
  if ("errore" in accesso) return accesso;

  const iscrizione = await prisma.iscrizioneCorso.findUnique({
    where: { id: dati.iscrizioneId },
    include: { persona: true },
  });
  if (!iscrizione || iscrizione.corsoId !== accesso.corsoId || iscrizione.deletedAt) {
    return { errore: "Iscrizione non trovata per questo corso." };
  }

  await prisma.presenza.upsert({
    where: { lezioneId_iscrizioneId: { lezioneId, iscrizioneId: dati.iscrizioneId } },
    create: {
      lezioneId,
      iscrizioneId: dati.iscrizioneId,
      stato: dati.stato,
      metodo: dati.metodo,
      oraIngresso: new Intl.DateTimeFormat("it-IT", { hour: "2-digit", minute: "2-digit" }).format(new Date()),
      rilevataDaId: utente.id,
    },
    update: {
      stato: dati.stato,
      metodo: dati.metodo,
      rilevataDaId: utente.id,
    },
  });

  await registraAudit({
    utenteId: utente.id,
    entita: "Presenza",
    entitaId: `${lezioneId}:${dati.iscrizioneId}`,
    azione: "registrazione",
    diff: { stato: dati.stato, metodo: dati.metodo },
  });

  revalidatePath(`/corsi/${accesso.corsoId}`);
  revalidatePath(`/corsi/${accesso.corsoId}/lezioni/${lezioneId}/appello`);
  return { successo: true, nomeCognome: `${iscrizione.persona.cognome} ${iscrizione.persona.nome}` };
}

/**
 * Variante per il check-in via QR: la persona si identifica scansionando il
 * proprio codice (che codifica l'id dell'iscrizione) invece di essere
 * selezionata a mano dal docente dalla lista.
 */
export async function registraPresenzaDaQr(
  lezioneId: string,
  iscrizioneId: string
): Promise<EsitoRegistraPresenza> {
  return registraPresenza(lezioneId, { iscrizioneId, stato: "presente", metodo: "qr" });
}
