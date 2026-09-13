import { SEZIONI_MODELLO_D } from "@/lib/validazioni/contabilita";

/**
 * Calcolo del rendiconto per cassa (Mod. D, DM 5/3/2020 — o Mod. E "forma
 * aggregata", DM 18/2/2026, se `formaAggregata` è true): funzione pura,
 * senza accesso al DB, per poterla testare isolatamente sulle regole di
 * business (§6 M6). Ogni voce di prima nota viene attribuita a una delle 5
 * sezioni A-E secondo la mappatura fornita dal chiamante (mai decisa da
 * questo software, §12); le categorie prive di mappatura vengono comunque
 * sommate nel totale generale, ma segnalate a parte invece di essere
 * silenziosamente ignorate o forzate in una sezione a caso.
 */
export type MovimentoPerRendiconto = {
  tipo: "entrata" | "uscita";
  importo: number;
  categoriaRendiconto: string;
};

export type RigaCategoria = { categoria: string; importo: number };

export type SezioneRendiconto = {
  sezione: (typeof SEZIONI_MODELLO_D)[number];
  entrate: number;
  uscite: number;
  avanzo: number;
  dettaglioEntrate: RigaCategoria[];
  dettaglioUscite: RigaCategoria[];
};

export type Rendiconto = {
  sezioni: SezioneRendiconto[];
  totaleEntrate: number;
  totaleUscite: number;
  avanzoDisavanzo: number;
  categorieNonMappate: string[];
};

function nuovaSezione(sezione: (typeof SEZIONI_MODELLO_D)[number]): SezioneRendiconto {
  return { sezione, entrate: 0, uscite: 0, avanzo: 0, dettaglioEntrate: [], dettaglioUscite: [] };
}

function accumula(righe: RigaCategoria[], categoria: string, importo: number): void {
  const riga = righe.find((r) => r.categoria === categoria);
  if (riga) riga.importo += importo;
  else righe.push({ categoria, importo });
}

export function calcolaRendiconto(
  movimenti: MovimentoPerRendiconto[],
  mappatura: Record<string, string>,
  formaAggregata: boolean
): Rendiconto {
  const sezioniMap = new Map(SEZIONI_MODELLO_D.map((s) => [s, nuovaSezione(s)]));
  const categorieNonMappateSet = new Set<string>();
  let totaleEntrate = 0;
  let totaleUscite = 0;

  for (const movimento of movimenti) {
    if (movimento.tipo === "entrata") totaleEntrate += movimento.importo;
    else totaleUscite += movimento.importo;

    const sezioneCodice = mappatura[movimento.categoriaRendiconto];
    const sezione = sezioneCodice ? sezioniMap.get(sezioneCodice as (typeof SEZIONI_MODELLO_D)[number]) : undefined;
    if (!sezione) {
      categorieNonMappateSet.add(movimento.categoriaRendiconto);
      continue;
    }

    if (movimento.tipo === "entrata") {
      sezione.entrate += movimento.importo;
      if (!formaAggregata) accumula(sezione.dettaglioEntrate, movimento.categoriaRendiconto, movimento.importo);
    } else {
      sezione.uscite += movimento.importo;
      if (!formaAggregata) accumula(sezione.dettaglioUscite, movimento.categoriaRendiconto, movimento.importo);
    }
  }

  const sezioni = SEZIONI_MODELLO_D.map((s) => {
    const sezione = sezioniMap.get(s)!;
    sezione.avanzo = sezione.entrate - sezione.uscite;
    return sezione;
  });

  return {
    sezioni,
    totaleEntrate,
    totaleUscite,
    avanzoDisavanzo: totaleEntrate - totaleUscite,
    categorieNonMappate: Array.from(categorieNonMappateSet),
  };
}
