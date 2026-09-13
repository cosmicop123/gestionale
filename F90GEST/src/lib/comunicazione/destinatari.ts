import "server-only";
import { prisma } from "@/lib/prisma";

export type Destinatario = {
  personaId: string;
  email: string;
  variabili: Record<string, string>;
};

type ParametriSegmento = { corsoId?: string; personaIds?: string[] } | null;

function destinatarioDaPersona(
  persona: { id: string; nome: string; cognome: string; email: string | null },
  extra: Record<string, string> = {}
): Destinatario | null {
  if (!persona.email) return null;
  return { personaId: persona.id, email: persona.email, variabili: { nome: persona.nome, cognome: persona.cognome, ...extra } };
}

/**
 * Risolve un segmento di destinatari (§9) nell'elenco di persone da
 * contattare, con le variabili di template già pronte per quella persona.
 * Filtra sempre le persone senza email: non hanno un canale per ricevere la
 * comunicazione, quindi non generano nemmeno una riga ComunicazioneInvio.
 */
export async function risolviDestinatari(segmento: string, segmentoParametri: ParametriSegmento): Promise<Destinatario[]> {
  switch (segmento) {
    case "soci_attivi": {
      const soci = await prisma.socio.findMany({
        where: { storicoStati: { some: { stato: "attivo", dataFine: null } } },
        include: { persona: true },
      });
      return soci.map((s) => destinatarioDaPersona(s.persona)).filter((d): d is Destinatario => d !== null);
    }
    case "iscritti_corso": {
      const corsoId = segmentoParametri?.corsoId;
      if (!corsoId) return [];
      const corso = await prisma.corso.findUnique({ where: { id: corsoId } });
      const iscrizioni = await prisma.iscrizioneCorso.findMany({
        where: { corsoId, stato: { in: ["confermato", "preiscritto"] }, deletedAt: null },
        include: { persona: true },
      });
      return iscrizioni
        .map((i) => destinatarioDaPersona(i.persona, { corso: corso?.titolo ?? "" }))
        .filter((d): d is Destinatario => d !== null);
    }
    case "morosi": {
      const quote = await prisma.quota.findMany({
        where: { stato: { in: ["da_pagare", "parziale"] }, deletedAt: null, scadenza: { lt: new Date() } },
        include: { persona: true },
        orderBy: { scadenza: "asc" },
      });
      const primaQuotaPerPersona = new Map<string, (typeof quote)[number]>();
      for (const quota of quote) {
        if (!primaQuotaPerPersona.has(quota.personaId)) primaQuotaPerPersona.set(quota.personaId, quota);
      }
      return [...primaQuotaPerPersona.values()]
        .map((q) =>
          destinatarioDaPersona(q.persona, {
            importo: Number(q.importo).toFixed(2),
            scadenza: new Intl.DateTimeFormat("it-IT").format(q.scadenza),
          })
        )
        .filter((d): d is Destinatario => d !== null);
    }
    case "volontari": {
      const ruoli = await prisma.ruoloPersona.findMany({
        where: { tipo: "volontario", attivo: true },
        include: { persona: true },
      });
      return ruoli.map((r) => destinatarioDaPersona(r.persona)).filter((d): d is Destinatario => d !== null);
    }
    case "personalizzato": {
      const ids = segmentoParametri?.personaIds ?? [];
      if (ids.length === 0) return [];
      const persone = await prisma.persona.findMany({ where: { id: { in: ids }, deletedAt: null } });
      return persone.map((p) => destinatarioDaPersona(p)).filter((d): d is Destinatario => d !== null);
    }
    default:
      return [];
  }
}
