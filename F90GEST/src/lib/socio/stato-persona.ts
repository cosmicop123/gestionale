export type BadgeStatoPersona = {
  etichetta: string;
  variante: "default" | "secondary" | "success" | "warning" | "destructive" | "outline";
};

/** Sottoinsieme minimo di dati necessari per calcolare lo stato mostrato in lista/scheda. */
export type DatiStatoPersona = {
  socio: { storicoStati: { stato: string; dataInizio: Date }[] } | null;
  domandeAmmissione: { stato: string; createdAt: Date }[];
};

export function statoCorrenteSocio(storicoStati: { stato: string; dataInizio: Date }[]): string | null {
  if (storicoStati.length === 0) return null;
  return [...storicoStati].sort((a, b) => b.dataInizio.getTime() - a.dataInizio.getTime())[0].stato;
}

const ETICHETTE_STATO_SOCIO: Record<string, BadgeStatoPersona> = {
  in_attesa: { etichetta: "Socio · in attesa", variante: "warning" },
  attivo: { etichetta: "Socio attivo", variante: "success" },
  sospeso: { etichetta: "Socio sospeso", variante: "secondary" },
  cessato: { etichetta: "Socio cessato", variante: "outline" },
};

export function badgeStatoPersona(dati: DatiStatoPersona): BadgeStatoPersona {
  if (dati.socio) {
    const stato = statoCorrenteSocio(dati.socio.storicoStati);
    if (stato && ETICHETTE_STATO_SOCIO[stato]) return ETICHETTE_STATO_SOCIO[stato];
  }

  const domandaPiuRecente = [...dati.domandeAmmissione].sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
  )[0];

  if (domandaPiuRecente?.stato === "in_valutazione") {
    return { etichetta: "Domanda in valutazione", variante: "warning" };
  }
  if (domandaPiuRecente?.stato === "respinta") {
    return { etichetta: "Domanda respinta", variante: "destructive" };
  }

  return { etichetta: "Nessuna domanda", variante: "outline" };
}
