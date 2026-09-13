"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { richiediRuolo } from "@/lib/auth/richiedi-utente";
import { registraAudit } from "@/lib/audit";
import { schemaPersona, type DatiPersona } from "@/lib/validazioni/persona";

export type EsitoAzionePersona = { errore: string } | { successo: true; personaId: string };

function datiRelazioneFamiliare(dati: DatiPersona) {
  if (!dati.genitore) return undefined;
  return {
    genitoreNomeCognome: dati.genitore.genitoreNomeCognome,
    genitoreCodiceFiscale: dati.genitore.genitoreCodiceFiscale || null,
    genitoreEmail: dati.genitore.genitoreEmail || null,
    genitoreTelefono: dati.genitore.genitoreTelefono || null,
    gradoParentela: dati.genitore.gradoParentela,
  };
}

export async function creaPersona(datiGrezzi: DatiPersona): Promise<EsitoAzionePersona> {
  const utente = await richiediRuolo(["amministratore", "segreteria"]);

  const risultato = schemaPersona.safeParse(datiGrezzi);
  if (!risultato.success) {
    return { errore: risultato.error.issues[0]?.message ?? "Dati non validi." };
  }
  const dati = risultato.data;
  const relazione = datiRelazioneFamiliare(dati);

  try {
    const persona = await prisma.$transaction(async (tx) => {
      const nuovaPersona = await tx.persona.create({
        data: {
          nome: dati.nome,
          cognome: dati.cognome,
          codiceFiscale: dati.codiceFiscale.toUpperCase(),
          dataNascita: dati.dataNascita ? new Date(dati.dataNascita) : null,
          comuneNascita: dati.comuneNascita || null,
          provinciaNascita: dati.provinciaNascita || null,
          sesso: dati.sesso ?? null,
          residenzaVia: dati.residenzaVia || null,
          residenzaCap: dati.residenzaCap || null,
          residenzaComune: dati.residenzaComune || null,
          residenzaProvincia: dati.residenzaProvincia || null,
          email: dati.email || null,
          telefono: dati.telefono || null,
          note: dati.note || null,
          createdById: utente.id,
        },
      });

      if (relazione) {
        await tx.relazioneFamiliare.create({
          data: { minoreId: nuovaPersona.id, ...relazione },
        });
      }

      return nuovaPersona;
    });

    await registraAudit({
      utenteId: utente.id,
      entita: "Persona",
      entitaId: persona.id,
      azione: "creazione",
    });

    revalidatePath("/soci");
    return { successo: true, personaId: persona.id };
  } catch (errore) {
    if (errore instanceof Prisma.PrismaClientKnownRequestError && errore.code === "P2002") {
      return { errore: "Esiste già una persona con questo codice fiscale." };
    }
    throw errore;
  }
}

export async function aggiornaPersona(
  personaId: string,
  datiGrezzi: DatiPersona
): Promise<EsitoAzionePersona> {
  const utente = await richiediRuolo(["amministratore", "segreteria"]);

  const risultato = schemaPersona.safeParse(datiGrezzi);
  if (!risultato.success) {
    return { errore: risultato.error.issues[0]?.message ?? "Dati non validi." };
  }
  const dati = risultato.data;
  const relazione = datiRelazioneFamiliare(dati);

  try {
    await prisma.$transaction(async (tx) => {
      await tx.persona.update({
        where: { id: personaId },
        data: {
          nome: dati.nome,
          cognome: dati.cognome,
          codiceFiscale: dati.codiceFiscale.toUpperCase(),
          dataNascita: dati.dataNascita ? new Date(dati.dataNascita) : null,
          comuneNascita: dati.comuneNascita || null,
          provinciaNascita: dati.provinciaNascita || null,
          sesso: dati.sesso ?? null,
          residenzaVia: dati.residenzaVia || null,
          residenzaCap: dati.residenzaCap || null,
          residenzaComune: dati.residenzaComune || null,
          residenzaProvincia: dati.residenzaProvincia || null,
          email: dati.email || null,
          telefono: dati.telefono || null,
          note: dati.note || null,
        },
      });

      const relazioneEsistente = await tx.relazioneFamiliare.findFirst({
        where: { minoreId: personaId, deletedAt: null },
      });

      if (relazione && relazioneEsistente) {
        await tx.relazioneFamiliare.update({
          where: { id: relazioneEsistente.id },
          data: relazione,
        });
      } else if (relazione && !relazioneEsistente) {
        await tx.relazioneFamiliare.create({ data: { minoreId: personaId, ...relazione } });
      } else if (!relazione && relazioneEsistente) {
        // La persona non risulta più minorenne (o il genitore è stato rimosso dal form):
        // soft-delete della relazione invece di un DELETE fisico.
        await tx.relazioneFamiliare.update({
          where: { id: relazioneEsistente.id },
          data: { deletedAt: new Date() },
        });
      }
    });

    await registraAudit({
      utenteId: utente.id,
      entita: "Persona",
      entitaId: personaId,
      azione: "modifica",
    });

    revalidatePath("/soci");
    revalidatePath(`/soci/${personaId}`);
    return { successo: true, personaId };
  } catch (errore) {
    if (errore instanceof Prisma.PrismaClientKnownRequestError && errore.code === "P2002") {
      return { errore: "Esiste già una persona con questo codice fiscale." };
    }
    throw errore;
  }
}
