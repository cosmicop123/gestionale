"use server";

import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { registraAudit } from "@/lib/audit";
import { verificaELimitaTentativi } from "@/lib/auth/rate-limit";
import { isMinorenne } from "@/lib/persona/eta";
import { schemaIscrizionePubblica, type DatiIscrizionePubblica } from "@/lib/validazioni/consenso";

export type EsitoIscrizionePubblica = { errore: string } | { successo: true };

const TIPI_CONSENSO_BOOLEANI = [
  { tipo: "trattamento_finalita_associative", campo: "consensoTrattamento" as const },
  { tipo: "immagini_video", campo: "consensoImmagini" as const },
  { tipo: "newsletter_promozionale", campo: "consensoNewsletter" as const },
  { tipo: "comunicazione_terzi", campo: "consensoTerzi" as const },
];

/**
 * Riceve una preiscrizione dalla pagina pubblica di un corso (§6 M5): nessuna
 * autenticazione richiesta, quindi ogni scrittura resta rigorosamente lato
 * server (rivalidazione completa dei dati, mai fidarsi del client) e con
 * rate limiting per IP contro lo spam. L'iscrizione risultante è sempre in
 * stato "preiscritto", anche se ci sono posti liberi: la conferma resta una
 * decisione della segreteria, che può così verificare prima consensi e dati
 * del minore (§7.5) — a differenza delle iscrizioni interne di M4, che sono
 * già gestite direttamente da personale autenticato.
 */
export async function inviaPreiscrizionePubblica(
  corsoId: string,
  datiGrezzi: DatiIscrizionePubblica
): Promise<EsitoIscrizionePubblica> {
  const elencoHeader = await headers();
  const ip = elencoHeader.get("x-forwarded-for") ?? elencoHeader.get("x-real-ip") ?? "sconosciuto";

  const esitoLimite = verificaELimitaTentativi(`iscrizione-pubblica:${ip}`);
  if (!esitoLimite.consentito) {
    return {
      errore: `Troppe richieste da questo indirizzo. Riprova tra ${Math.ceil((esitoLimite.riprovaTraSecondi ?? 60) / 60)} minuti.`,
    };
  }

  const risultato = schemaIscrizionePubblica.safeParse(datiGrezzi);
  if (!risultato.success) {
    return { errore: risultato.error.issues[0]?.message ?? "Dati non validi." };
  }
  const dati = risultato.data;

  const corso = await prisma.corso.findUnique({ where: { id: corsoId } });
  if (!corso || corso.deletedAt || corso.stato !== "aperto_iscrizioni") {
    return { errore: "Questo corso non è al momento aperto alle iscrizioni online." };
  }

  const informativa = await prisma.informativa.findFirst({ orderBy: { dataPubblicazione: "desc" } });
  if (!informativa) {
    return { errore: "Il modulo di iscrizione online non è ancora attivo: contatta la segreteria." };
  }

  const dataNascita = new Date(dati.dataNascita);
  const codiceFiscale = dati.codiceFiscale.toUpperCase();

  try {
    await prisma.$transaction(async (tx) => {
      // Riusa la persona già censita con lo stesso codice fiscale invece di
      // duplicarla; non sovrascrive mai dati esistenti (solo campi vuoti),
      // perché un form pubblico non autenticato non deve poter alterare
      // l'anagrafica di una persona già nota al gestionale.
      let persona = await tx.persona.findUnique({ where: { codiceFiscale } });
      if (!persona) {
        persona = await tx.persona.create({
          data: {
            nome: dati.nome,
            cognome: dati.cognome,
            codiceFiscale,
            dataNascita,
            sesso: dati.sesso ?? null,
            email: dati.email || null,
            telefono: dati.telefono || null,
          },
        });
      } else {
        const aggiornamenti: { email?: string; telefono?: string } = {};
        if (!persona.email && dati.email) aggiornamenti.email = dati.email;
        if (!persona.telefono && dati.telefono) aggiornamenti.telefono = dati.telefono;
        if (Object.keys(aggiornamenti).length > 0) {
          persona = await tx.persona.update({ where: { id: persona.id }, data: aggiornamenti });
        }
      }

      if (dati.genitore && isMinorenne(dataNascita)) {
        const relazioneEsistente = await tx.relazioneFamiliare.findFirst({
          where: { minoreId: persona.id, deletedAt: null },
        });
        if (!relazioneEsistente) {
          await tx.relazioneFamiliare.create({
            data: {
              minoreId: persona.id,
              genitoreNomeCognome: dati.genitore.genitoreNomeCognome,
              genitoreCodiceFiscale: dati.genitore.genitoreCodiceFiscale || null,
              genitoreEmail: dati.genitore.genitoreEmail || null,
              genitoreTelefono: dati.genitore.genitoreTelefono || null,
              gradoParentela: dati.genitore.gradoParentela,
            },
          });
        }
      }

      for (const { tipo, campo } of TIPI_CONSENSO_BOOLEANI) {
        const concesso = dati[campo];
        await tx.consenso.create({
          data: {
            personaId: persona.id,
            informativaId: informativa.id,
            tipo,
            stato: concesso ? "concesso" : "negato",
            data: new Date(),
            modalita: "form_online",
            ipRichiesta: ip,
            canaliAutorizzatiImmagini:
              tipo === "immagini_video" && concesso ? JSON.stringify(dati.canaliImmagini ?? []) : null,
          },
        });
      }

      const iscrizioneEsistente = await tx.iscrizioneCorso.findUnique({
        where: { personaId_corsoId: { personaId: persona.id, corsoId } },
      });
      if (iscrizioneEsistente && iscrizioneEsistente.stato !== "ritirato") {
        throw new Error("ISCRIZIONE_GIA_PRESENTE");
      }

      if (iscrizioneEsistente) {
        await tx.iscrizioneCorso.update({
          where: { id: iscrizioneEsistente.id },
          data: { stato: "preiscritto", canale: "form_online", dataIscrizione: new Date() },
        });
      } else {
        await tx.iscrizioneCorso.create({
          data: { personaId: persona.id, corsoId, canale: "form_online", stato: "preiscritto" },
        });
      }

      await registraAudit({
        utenteId: null,
        entita: "IscrizioneCorso",
        entitaId: `${persona.id}:${corsoId}`,
        azione: "preiscrizione_pubblica",
        ip,
      });
    });
  } catch (errore) {
    if (errore instanceof Error && errore.message === "ISCRIZIONE_GIA_PRESENTE") {
      return { errore: "Risulta già una richiesta di iscrizione a questo corso per questa persona." };
    }
    throw errore;
  }

  return { successo: true };
}
