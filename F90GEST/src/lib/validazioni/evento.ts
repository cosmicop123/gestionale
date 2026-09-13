import { z } from "zod";

export const TIPOLOGIE_EVENTO = ["spettacolo", "festa", "cineforum", "conferenza", "raccolta_fondi"] as const;
export const ETICHETTE_TIPOLOGIE_EVENTO: Record<(typeof TIPOLOGIE_EVENTO)[number], string> = {
  spettacolo: "Spettacolo",
  festa: "Festa",
  cineforum: "Cineforum",
  conferenza: "Conferenza",
  raccolta_fondi: "Raccolta fondi",
};

export const TIPI_INGRESSO_EVENTO = ["gratuito", "oblazione_volontaria", "corrispettivo"] as const;
export const ETICHETTE_TIPI_INGRESSO: Record<(typeof TIPI_INGRESSO_EVENTO)[number], string> = {
  gratuito: "Gratuito",
  oblazione_volontaria: "Oblazione volontaria",
  corrispettivo: "Corrispettivo (biglietto)",
};

export const STATI_EVENTO = ["bozza", "programmato", "in_corso", "concluso", "annullato"] as const;
export const ETICHETTE_STATI_EVENTO: Record<(typeof STATI_EVENTO)[number], string> = {
  bozza: "Bozza",
  programmato: "Programmato",
  in_corso: "In corso",
  concluso: "Concluso",
  annullato: "Annullato",
};

export const schemaEvento = z.object({
  titolo: z.string().min(1, "Inserire il titolo dell'evento."),
  tipologia: z.enum(TIPOLOGIE_EVENTO, { message: "Selezionare la tipologia." }),
  dataInizio: z.string().min(1, "Inserire la data di inizio."),
  dataFine: z.string().optional().or(z.literal("")),
  luogo: z.string().optional().or(z.literal("")),
  descrizione: z.string().optional().or(z.literal("")),
  tipoIngresso: z.enum(TIPI_INGRESSO_EVENTO, { message: "Selezionare il tipo di ingresso." }),
  capienza: z.string().optional().or(z.literal("")),
});
export type DatiEvento = z.infer<typeof schemaEvento>;

export const schemaIncassoEvento = z.object({
  contoId: z.string().min(1, "Selezionare il conto di destinazione."),
  importo: z
    .string()
    .min(1, "Inserire l'importo.")
    .refine((v) => Number(v) > 0, "L'importo deve essere maggiore di zero."),
  data: z.string().min(1, "Inserire la data."),
  causale: z.string().min(1, "Inserire la causale."),
});
export type DatiIncassoEvento = z.infer<typeof schemaIncassoEvento>;

export const schemaCambioStatoEvento = z.object({
  stato: z.enum(STATI_EVENTO, { message: "Selezionare uno stato valido." }),
});
export type DatiCambioStatoEvento = z.infer<typeof schemaCambioStatoEvento>;

export const schemaPartecipazioneEvento = z
  .object({
    personaId: z.string().optional().or(z.literal("")),
    nomeLibero: z.string().optional().or(z.literal("")),
    bigliettoOblazione: z.string().optional().or(z.literal("")),
  })
  .refine((dati) => dati.personaId || dati.nomeLibero, {
    message: "Selezionare una persona censita oppure indicare un nome.",
    path: ["nomeLibero"],
  });
export type DatiPartecipazioneEvento = z.infer<typeof schemaPartecipazioneEvento>;

export const STATI_TURNO_VOLONTARIO = ["proposto", "confermato", "rifiutato"] as const;
export const ETICHETTE_STATI_TURNO: Record<(typeof STATI_TURNO_VOLONTARIO)[number], string> = {
  proposto: "Proposto",
  confermato: "Confermato",
  rifiutato: "Rifiutato",
};

export const schemaTurnoVolontario = z.object({
  volontarioId: z.string().min(1, "Selezionare un volontario."),
  mansione: z.string().min(1, "Inserire la mansione."),
  oraInizio: z.string().optional().or(z.literal("")),
  oraFine: z.string().optional().or(z.literal("")),
});
export type DatiTurnoVolontario = z.infer<typeof schemaTurnoVolontario>;

export const STATI_PRATICA_SIAE = ["da_predisporre", "inviata", "approvata", "chiusa"] as const;
export const ETICHETTE_STATI_PRATICA_SIAE: Record<(typeof STATI_PRATICA_SIAE)[number], string> = {
  da_predisporre: "Da predisporre",
  inviata: "Inviata",
  approvata: "Approvata",
  chiusa: "Chiusa",
};

export const schemaPraticaSiae = z.object({
  tipoPermesso: z.string().min(1, "Inserire il tipo di permesso."),
  dataInvio: z.string().optional().or(z.literal("")),
  protocollo: z.string().optional().or(z.literal("")),
  minimoGarantito: z.string().optional().or(z.literal("")),
  importoPagato: z.string().optional().or(z.literal("")),
  conguaglio: z.string().optional().or(z.literal("")),
  stato: z.enum(STATI_PRATICA_SIAE, { message: "Selezionare uno stato valido." }),
});
export type DatiPraticaSiae = z.infer<typeof schemaPraticaSiae>;

export const schemaBranoProgramma = z
  .object({
    branoEsistenteId: z.string().optional().or(z.literal("")),
    titolo: z.string().optional().or(z.literal("")),
    autore: z.string().optional().or(z.literal("")),
    editore: z.string().optional().or(z.literal("")),
    ordineEsecuzione: z.string().optional().or(z.literal("")),
  })
  .refine((dati) => dati.branoEsistenteId || (dati.titolo && dati.autore), {
    message: "Selezionare un brano dall'archivio oppure inserire titolo e autore di un brano nuovo.",
    path: ["titolo"],
  });
export type DatiBranoProgramma = z.infer<typeof schemaBranoProgramma>;

export const TIPI_SPONSOR = ["sponsorizzazione", "erogazione_liberale", "contributo_pubblico"] as const;
export const ETICHETTE_TIPI_SPONSOR: Record<(typeof TIPI_SPONSOR)[number], string> = {
  sponsorizzazione: "Sponsorizzazione",
  erogazione_liberale: "Erogazione liberale",
  contributo_pubblico: "Contributo pubblico",
};

export const STATI_SPONSOR = ["richiesto", "accettato", "incassato", "rifiutato"] as const;
export const ETICHETTE_STATI_SPONSOR: Record<(typeof STATI_SPONSOR)[number], string> = {
  richiesto: "Richiesto",
  accettato: "Accettato",
  incassato: "Incassato",
  rifiutato: "Rifiutato",
};

export const schemaSponsorContributo = z
  .object({
    soggettoId: z.string().optional().or(z.literal("")),
    soggettoLibero: z.string().optional().or(z.literal("")),
    tipo: z.enum(TIPI_SPONSOR, { message: "Selezionare il tipo." }),
    importo: z
      .string()
      .min(1, "Inserire l'importo.")
      .refine((v) => Number(v) > 0, "L'importo deve essere maggiore di zero."),
    data: z.string().min(1, "Inserire la data."),
    eventoId: z.string().optional().or(z.literal("")),
    raccoltaFondiId: z.string().optional().or(z.literal("")),
  })
  .refine((dati) => dati.soggettoId || dati.soggettoLibero, {
    message: "Selezionare un soggetto censito oppure indicarne la ragione sociale.",
    path: ["soggettoLibero"],
  });
export type DatiSponsorContributo = z.infer<typeof schemaSponsorContributo>;

export const schemaIncassoSponsor = z.object({
  contoId: z.string().min(1, "Selezionare il conto di destinazione."),
});
export type DatiIncassoSponsor = z.infer<typeof schemaIncassoSponsor>;

export const schemaRaccoltaFondi = z.object({
  denominazione: z.string().min(1, "Inserire la denominazione della raccolta fondi."),
  periodoInizio: z.string().min(1, "Inserire la data di inizio."),
  periodoFine: z.string().optional().or(z.literal("")),
  eventoId: z.string().optional().or(z.literal("")),
});
export type DatiRaccoltaFondi = z.infer<typeof schemaRaccoltaFondi>;

export const schemaMovimentoRaccoltaFondi = z.object({
  tipo: z.enum(["entrata", "uscita"]),
  data: z.string().min(1, "Inserire la data."),
  importo: z
    .string()
    .min(1, "Inserire l'importo.")
    .refine((v) => Number(v) > 0, "L'importo deve essere maggiore di zero."),
  contoId: z.string().min(1, "Selezionare il conto."),
  causale: z.string().min(1, "Inserire la causale."),
});
export type DatiMovimentoRaccoltaFondi = z.infer<typeof schemaMovimentoRaccoltaFondi>;
