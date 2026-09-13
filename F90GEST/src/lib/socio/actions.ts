"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { richiediRuolo } from "@/lib/auth/richiedi-utente";
import { registraAudit } from "@/lib/audit";
import { prossimoNumero } from "@/lib/numeratore";
import {
  schemaDomandaAmmissione,
  schemaApprovazioneDomanda,
  schemaRigettoDomanda,
  type DatiDomandaAmmissione,
  type DatiApprovazioneDomanda,
} from "@/lib/validazioni/socio";

export type EsitoAzioneSocio = { errore: string } | { successo: true };

export async function creaDomandaAmmissione(
  datiGrezzi: DatiDomandaAmmissione
): Promise<EsitoAzioneSocio> {
  const utente = await richiediRuolo(["amministratore", "segreteria"]);

  const risultato = schemaDomandaAmmissione.safeParse(datiGrezzi);
  if (!risultato.success) {
    return { errore: risultato.error.issues[0]?.message ?? "Dati non validi." };
  }
  const dati = risultato.data;

  const personaGiaSocia = await prisma.socio.findUnique({ where: { personaId: dati.personaId } });
  if (personaGiaSocia) {
    return { errore: "Questa persona è già socia." };
  }
  const domandaInCorso = await prisma.domandaAmmissione.findFirst({
    where: { personaId: dati.personaId, stato: "in_valutazione", deletedAt: null },
  });
  if (domandaInCorso) {
    return { errore: "Esiste già una domanda di ammissione in valutazione per questa persona." };
  }

  const domanda = await prisma.domandaAmmissione.create({
    data: {
      personaId: dati.personaId,
      dataDomanda: new Date(dati.dataDomanda),
      categoriaProposta: dati.categoriaProposta,
      note: dati.note || null,
      createdById: utente.id,
    },
  });

  await registraAudit({
    utenteId: utente.id,
    entita: "DomandaAmmissione",
    entitaId: domanda.id,
    azione: "creazione",
  });

  revalidatePath("/soci");
  return { successo: true };
}

/**
 * Approva una domanda di ammissione: assegna il numero di libro soci (dal
 * Numeratore, mai riassegnato) e crea Socio + primo SocioStato in un'unica
 * transazione (§6 M2, §7.1). Lo stato iniziale è "in_attesa": la specifica
 * descrive il flusso come domanda → delibera → iscrizione → PAGAMENTO quota
 * → tessera, quindi il socio passa ad "attivo" quando la quota viene
 * incassata (transizione che si implementerà nella milestone M3, insieme a
 * quote e pagamenti).
 */
export async function approvaDomandaAmmissione(
  domandaId: string,
  datiGrezzi: DatiApprovazioneDomanda
): Promise<EsitoAzioneSocio> {
  const utente = await richiediRuolo(["amministratore", "segreteria"]);

  const risultato = schemaApprovazioneDomanda.safeParse(datiGrezzi);
  if (!risultato.success) {
    return { errore: risultato.error.issues[0]?.message ?? "Dati non validi." };
  }
  const dati = risultato.data;

  const domanda = await prisma.domandaAmmissione.findUnique({ where: { id: domandaId } });
  if (!domanda || domanda.deletedAt) {
    return { errore: "Domanda di ammissione non trovata." };
  }
  if (domanda.stato !== "in_valutazione") {
    return { errore: "Questa domanda è già stata evasa." };
  }

  const dataDecorrenza = new Date(dati.dataDecorrenza);
  const socioId = await prisma.$transaction(async (tx) => {
    const numeroLibroSoci = await prossimoNumero(tx, "libro_soci");

    const socio = await tx.socio.create({
      data: {
        personaId: domanda.personaId,
        numeroLibroSoci,
        categoria: dati.categoria,
        dataDomandaAmmissione: domanda.dataDomanda,
        dataDeliberaAmmissione: new Date(dati.dataDelibera),
        dataDecorrenza,
        createdById: utente.id,
      },
    });

    await tx.socioStato.create({
      data: {
        socioId: socio.id,
        stato: "in_attesa",
        dataInizio: dataDecorrenza,
        createdById: utente.id,
      },
    });

    await tx.domandaAmmissione.update({
      where: { id: domandaId },
      data: { stato: "approvata", dataEsito: new Date(), socioId: socio.id },
    });

    return socio.id;
  });

  await registraAudit({
    utenteId: utente.id,
    entita: "Socio",
    entitaId: socioId,
    azione: "ammissione",
    diff: { domandaId },
  });

  revalidatePath("/soci");
  revalidatePath("/soci/libro-soci");
  return { successo: true };
}

export async function rigettaDomandaAmmissione(
  domandaId: string,
  datiGrezzi: { motivoRigetto: string }
): Promise<EsitoAzioneSocio> {
  const utente = await richiediRuolo(["amministratore", "segreteria"]);

  const risultato = schemaRigettoDomanda.safeParse(datiGrezzi);
  if (!risultato.success) {
    return { errore: risultato.error.issues[0]?.message ?? "Motivo obbligatorio." };
  }

  const domanda = await prisma.domandaAmmissione.findUnique({ where: { id: domandaId } });
  if (!domanda || domanda.deletedAt) {
    return { errore: "Domanda di ammissione non trovata." };
  }
  if (domanda.stato !== "in_valutazione") {
    return { errore: "Questa domanda è già stata evasa." };
  }

  await prisma.domandaAmmissione.update({
    where: { id: domandaId },
    data: {
      stato: "respinta",
      dataEsito: new Date(),
      motivoRigetto: risultato.data.motivoRigetto,
    },
  });

  await registraAudit({
    utenteId: utente.id,
    entita: "DomandaAmmissione",
    entitaId: domandaId,
    azione: "rigetto",
  });

  revalidatePath("/soci");
  return { successo: true };
}
