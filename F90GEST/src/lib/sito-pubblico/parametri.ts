import "server-only";
import { prisma } from "@/lib/prisma";

const CHIAVE_PRESENTAZIONE = "sito_pubblico.presentazione";
const CHIAVE_URL_BASE = "sito_pubblico.url_base";

export async function ottieniParametriSitoPubblico() {
  const righe = await prisma.parametro.findMany({
    where: { chiave: { in: [CHIAVE_PRESENTAZIONE, CHIAVE_URL_BASE] } },
  });
  const mappa = new Map(righe.map((r) => [r.chiave, r.valore]));

  return {
    presentazione: mappa.get(CHIAVE_PRESENTAZIONE) ?? "",
    urlBase: mappa.get(CHIAVE_URL_BASE) ?? "",
  };
}

export async function salvaParametriSitoPubblico(dati: { presentazione: string; urlBase: string }): Promise<void> {
  await prisma.parametro.upsert({
    where: { chiave: CHIAVE_PRESENTAZIONE },
    create: {
      chiave: CHIAVE_PRESENTAZIONE,
      valore: dati.presentazione,
      descrizione: "Testo di presentazione dell'associazione mostrato nel sito pubblico generabile da Amministrazione.",
    },
    update: { valore: dati.presentazione },
  });
  await prisma.parametro.upsert({
    where: { chiave: CHIAVE_URL_BASE },
    create: {
      chiave: CHIAVE_URL_BASE,
      valore: dati.urlBase,
      descrizione:
        "URL pubblico dell'istanza del gestionale, usato per costruire i link di iscrizione ai corsi nel sito pubblico generabile (il sito può essere ospitato altrove).",
    },
    update: { valore: dati.urlBase },
  });
}
