"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { richiediRuolo } from "@/lib/auth/richiedi-utente";
import { registraAudit } from "@/lib/audit";
import { schemaIscrizioneCorso, type DatiIscrizioneCorso } from "@/lib/validazioni/corso";

export type EsitoAzione = { errore: string } | { successo: true };

const RUOLI_GESTIONE_ISCRIZIONI = ["amministratore", "segreteria"];

/**
 * Conta le iscrizioni che occupano un posto (confermate; le preiscrizioni
 * non sono usate nel flusso interno di M4, restano per il futuro modulo di
 * iscrizione pubblica di M5).
 */
async function contaPostiOccupati(corsoId: string, escludiIscrizioneId?: string): Promise<number> {
  return prisma.iscrizioneCorso.count({
    where: {
      corsoId,
      stato: "confermato",
      deletedAt: null,
      ...(escludiIscrizioneId ? { id: { not: escludiIscrizioneId } } : {}),
    },
  });
}

/**
 * Iscrive una persona a un corso: se la capienza massima è già raggiunta,
 * l'iscrizione va automaticamente in lista d'attesa invece che confermata
 * (§6 M4, "gestione lista d'attesa"). Nessun posto viene mai assegnato in
 * ordine diverso da quello di iscrizione.
 */
export async function iscriviPersona(corsoId: string, datiGrezzi: DatiIscrizioneCorso): Promise<EsitoAzione> {
  const utente = await richiediRuolo(RUOLI_GESTIONE_ISCRIZIONI);

  const risultato = schemaIscrizioneCorso.safeParse(datiGrezzi);
  if (!risultato.success) {
    return { errore: risultato.error.issues[0]?.message ?? "Dati non validi." };
  }
  const dati = risultato.data;

  const corso = await prisma.corso.findUnique({ where: { id: corsoId } });
  if (!corso || corso.deletedAt) return { errore: "Corso non trovato." };
  if (corso.stato === "annullato" || corso.stato === "concluso") {
    return { errore: "Non è possibile iscrivere a un corso annullato o già concluso." };
  }

  const esistente = await prisma.iscrizioneCorso.findUnique({
    where: { personaId_corsoId: { personaId: dati.personaId, corsoId } },
  });
  if (esistente && esistente.stato !== "ritirato") {
    return { errore: "Questa persona è già iscritta a questo corso." };
  }

  const postiOccupati = await contaPostiOccupati(corsoId);
  const postoDisponibile = corso.capienzaMassima === null || postiOccupati < corso.capienzaMassima;
  const stato = postoDisponibile ? "confermato" : "in_lista_attesa";

  const iscrizione = esistente
    ? await prisma.iscrizioneCorso.update({
        where: { id: esistente.id },
        data: { stato, canale: dati.canale, note: dati.note || null, dataIscrizione: new Date() },
      })
    : await prisma.iscrizioneCorso.create({
        data: {
          personaId: dati.personaId,
          corsoId,
          canale: dati.canale,
          stato,
          note: dati.note || null,
          createdById: utente.id,
        },
      });

  await registraAudit({
    utenteId: utente.id,
    entita: "IscrizioneCorso",
    entitaId: iscrizione.id,
    azione: postoDisponibile ? "iscrizione" : "iscrizione_lista_attesa",
  });

  revalidatePath(`/corsi/${corsoId}`);
  return { successo: true };
}

/**
 * Ritira un'iscrizione. Se la persona ritirata occupava un posto confermato,
 * promuove automaticamente la prima persona in lista d'attesa (per data di
 * iscrizione) al posto liberato.
 */
export async function ritiraIscrizione(iscrizioneId: string): Promise<EsitoAzione> {
  const utente = await richiediRuolo(RUOLI_GESTIONE_ISCRIZIONI);

  const iscrizione = await prisma.iscrizioneCorso.findUnique({ where: { id: iscrizioneId } });
  if (!iscrizione || iscrizione.deletedAt) return { errore: "Iscrizione non trovata." };
  if (iscrizione.stato === "ritirato") return { errore: "Questa iscrizione è già ritirata." };

  const eraConfermata = iscrizione.stato === "confermato";

  await prisma.$transaction(async (tx) => {
    await tx.iscrizioneCorso.update({ where: { id: iscrizioneId }, data: { stato: "ritirato" } });

    if (eraConfermata) {
      const prossimaInAttesa = await tx.iscrizioneCorso.findFirst({
        where: { corsoId: iscrizione.corsoId, stato: "in_lista_attesa", deletedAt: null },
        orderBy: { dataIscrizione: "asc" },
      });
      if (prossimaInAttesa) {
        await tx.iscrizioneCorso.update({ where: { id: prossimaInAttesa.id }, data: { stato: "confermato" } });
      }
    }
  });

  await registraAudit({
    utenteId: utente.id,
    entita: "IscrizioneCorso",
    entitaId: iscrizioneId,
    azione: "ritiro",
  });

  revalidatePath(`/corsi/${iscrizione.corsoId}`);
  return { successo: true };
}

/**
 * Conferma manualmente un'iscrizione in lista d'attesa (es. dopo un aumento
 * della capienza massima). Rifiutata se il posto non è realmente
 * disponibile, per non superare mai la capienza dichiarata.
 */
export async function confermaIscrizione(iscrizioneId: string): Promise<EsitoAzione> {
  const utente = await richiediRuolo(RUOLI_GESTIONE_ISCRIZIONI);

  const iscrizione = await prisma.iscrizioneCorso.findUnique({
    where: { id: iscrizioneId },
    include: { corso: true },
  });
  if (!iscrizione || iscrizione.deletedAt) return { errore: "Iscrizione non trovata." };
  if (iscrizione.stato !== "in_lista_attesa") return { errore: "Questa iscrizione non è in lista d'attesa." };

  const postiOccupati = await contaPostiOccupati(iscrizione.corsoId);
  const capienza = iscrizione.corso.capienzaMassima;
  if (capienza !== null && postiOccupati >= capienza) {
    return { errore: "Nessun posto disponibile: la capienza massima è già raggiunta." };
  }

  await prisma.iscrizioneCorso.update({ where: { id: iscrizioneId }, data: { stato: "confermato" } });

  await registraAudit({
    utenteId: utente.id,
    entita: "IscrizioneCorso",
    entitaId: iscrizioneId,
    azione: "conferma",
  });

  revalidatePath(`/corsi/${iscrizione.corsoId}`);
  return { successo: true };
}
