import { z } from "zod";

export const STATI_CORSO = ["bozza", "aperto_iscrizioni", "in_corso", "concluso", "annullato"] as const;
export const ETICHETTE_STATI_CORSO: Record<(typeof STATI_CORSO)[number], string> = {
  bozza: "Bozza",
  aperto_iscrizioni: "Aperto alle iscrizioni",
  in_corso: "In corso",
  concluso: "Concluso",
  annullato: "Annullato",
};

export const GIORNI_SETTIMANA = [
  { valore: 1, etichetta: "Lunedì" },
  { valore: 2, etichetta: "Martedì" },
  { valore: 3, etichetta: "Mercoledì" },
  { valore: 4, etichetta: "Giovedì" },
  { valore: 5, etichetta: "Venerdì" },
  { valore: 6, etichetta: "Sabato" },
  { valore: 0, etichetta: "Domenica" },
] as const;

export const CANALI_ISCRIZIONE_CORSO = ["form_online", "sportello", "whatsapp_importato"] as const;
export const ETICHETTE_CANALI_ISCRIZIONE: Record<(typeof CANALI_ISCRIZIONE_CORSO)[number], string> = {
  form_online: "Modulo online",
  sportello: "Sportello",
  whatsapp_importato: "Importata da WhatsApp",
};

export const STATI_ISCRIZIONE_CORSO = ["preiscritto", "confermato", "in_lista_attesa", "ritirato"] as const;
export const ETICHETTE_STATI_ISCRIZIONE: Record<(typeof STATI_ISCRIZIONE_CORSO)[number], string> = {
  preiscritto: "Preiscritto",
  confermato: "Confermato",
  in_lista_attesa: "In lista d'attesa",
  ritirato: "Ritirato",
};

export const STATI_LEZIONE = ["programmata", "svolta", "rinviata", "annullata"] as const;
export const ETICHETTE_STATI_LEZIONE: Record<(typeof STATI_LEZIONE)[number], string> = {
  programmata: "Programmata",
  svolta: "Svolta",
  rinviata: "Rinviata",
  annullata: "Annullata",
};

export const STATI_PRESENZA = ["presente", "assente", "giustificato", "ritardo"] as const;
export const ETICHETTE_STATI_PRESENZA: Record<(typeof STATI_PRESENZA)[number], string> = {
  presente: "Presente",
  assente: "Assente",
  giustificato: "Giustificato",
  ritardo: "Ritardo",
};

export const schemaCorso = z
  .object({
    titolo: z.string().min(1, "Inserire il titolo del corso."),
    edizione: z.string().optional().or(z.literal("")),
    descrizione: z.string().optional().or(z.literal("")),
    destinatari: z.string().optional().or(z.literal("")),
    sede: z.string().optional().or(z.literal("")),
    dataInizio: z.string().min(1, "Inserire la data di inizio."),
    capienzaMassima: z.string().optional().or(z.literal("")),
    quotaPartecipazione: z.string().optional().or(z.literal("")),
    percentualeMinimaPresenzaAttestato: z
      .string()
      .min(1, "Inserire la percentuale minima di presenza per l'attestato.")
      .refine((v) => Number(v) >= 0 && Number(v) <= 100, "La percentuale deve essere tra 0 e 100."),
    // Generazione automatica del calendario (§6 M4): facoltativa, se non
    // richiesta il corso parte senza lezioni e queste si aggiungono a mano.
    generaCalendario: z.boolean(),
    numeroLezioni: z.string().optional().or(z.literal("")),
    durataOreLezione: z.string().optional().or(z.literal("")),
    giorniSettimana: z.array(z.number().int().min(0).max(6)).optional(),
    oraInizioLezione: z.string().optional().or(z.literal("")),
    oraFineLezione: z.string().optional().or(z.literal("")),
    festivita: z.array(z.string()).optional(),
  })
  .refine((dati) => !dati.generaCalendario || (dati.giorniSettimana?.length ?? 0) > 0, {
    message: "Selezionare almeno un giorno della settimana per generare il calendario.",
    path: ["giorniSettimana"],
  })
  .refine((dati) => !dati.generaCalendario || Number(dati.numeroLezioni) > 0, {
    message: "Inserire il numero di lezioni da generare.",
    path: ["numeroLezioni"],
  })
  .refine((dati) => !dati.generaCalendario || Number(dati.durataOreLezione) > 0, {
    message: "Inserire la durata in ore di ogni lezione.",
    path: ["durataOreLezione"],
  });
export type DatiCorso = z.infer<typeof schemaCorso>;

// Modifica dei dati base di un corso già creato: niente rigenerazione del
// calendario da qui (rischierebbe di duplicare o disallineare lezioni e
// presenze già registrate) — le lezioni si gestiscono singolarmente dalla
// scheda corso dopo la creazione.
export const schemaModificaCorso = z.object({
  titolo: z.string().min(1, "Inserire il titolo del corso."),
  edizione: z.string().optional().or(z.literal("")),
  descrizione: z.string().optional().or(z.literal("")),
  destinatari: z.string().optional().or(z.literal("")),
  sede: z.string().optional().or(z.literal("")),
  dataInizio: z.string().min(1, "Inserire la data di inizio."),
  dataFine: z.string().optional().or(z.literal("")),
  capienzaMassima: z.string().optional().or(z.literal("")),
  quotaPartecipazione: z.string().optional().or(z.literal("")),
  percentualeMinimaPresenzaAttestato: z
    .string()
    .min(1, "Inserire la percentuale minima di presenza per l'attestato.")
    .refine((v) => Number(v) >= 0 && Number(v) <= 100, "La percentuale deve essere tra 0 e 100."),
});
export type DatiModificaCorso = z.infer<typeof schemaModificaCorso>;

export const schemaCambioStatoCorso = z.object({
  stato: z.enum(STATI_CORSO, { message: "Selezionare uno stato valido." }),
});
export type DatiCambioStatoCorso = z.infer<typeof schemaCambioStatoCorso>;

export const schemaDocenteCorso = z.object({
  personaId: z.string().min(1, "Selezionare una persona."),
});
export type DatiDocenteCorso = z.infer<typeof schemaDocenteCorso>;

export const schemaLezioneManuale = z.object({
  titolo: z.string().optional().or(z.literal("")),
  argomenti: z.string().optional().or(z.literal("")),
  data: z.string().min(1, "Inserire la data."),
  oraInizio: z.string().min(1, "Inserire l'ora di inizio."),
  oraFine: z.string().min(1, "Inserire l'ora di fine."),
  durataOre: z
    .string()
    .min(1, "Inserire la durata in ore.")
    .refine((v) => Number(v) > 0, "La durata deve essere maggiore di zero."),
  aulaSede: z.string().optional().or(z.literal("")),
  docenteEffettivoId: z.string().optional().or(z.literal("")),
});
export type DatiLezioneManuale = z.infer<typeof schemaLezioneManuale>;

export const schemaModificaLezione = z.object({
  stato: z.enum(STATI_LEZIONE, { message: "Selezionare uno stato valido." }),
  noteDocente: z.string().optional().or(z.literal("")),
});
export type DatiModificaLezione = z.infer<typeof schemaModificaLezione>;

export const schemaIscrizioneCorso = z.object({
  personaId: z.string().min(1, "Selezionare una persona."),
  canale: z.enum(CANALI_ISCRIZIONE_CORSO, { message: "Selezionare il canale di iscrizione." }),
  note: z.string().optional().or(z.literal("")),
});
export type DatiIscrizioneCorso = z.infer<typeof schemaIscrizioneCorso>;

export const schemaPresenza = z.object({
  iscrizioneId: z.string().min(1),
  stato: z.enum(STATI_PRESENZA, { message: "Selezionare uno stato di presenza valido." }),
  metodo: z.enum(["appello_manuale", "qr", "firma"]),
});
export type DatiPresenza = z.infer<typeof schemaPresenza>;
