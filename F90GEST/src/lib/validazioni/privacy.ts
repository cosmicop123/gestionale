import { z } from "zod";

export const TIPI_RICHIESTA_INTERESSATO = ["accesso", "rettifica", "cancellazione"] as const;
export const ETICHETTE_TIPI_RICHIESTA_INTERESSATO: Record<(typeof TIPI_RICHIESTA_INTERESSATO)[number], string> = {
  accesso: "Accesso ai dati",
  rettifica: "Rettifica",
  cancellazione: "Cancellazione",
};

export const schemaRichiestaInteressato = z.object({
  personaId: z.string().min(1, "Selezionare una persona."),
  tipo: z.enum(TIPI_RICHIESTA_INTERESSATO, { message: "Selezionare il tipo di richiesta." }),
  dataRichiesta: z.string().min(1, "Inserire la data della richiesta."),
});
export type DatiRichiestaInteressato = z.infer<typeof schemaRichiestaInteressato>;

export const schemaEvasioneRichiesta = z.object({
  esito: z.string().min(1, "Descrivere l'esito della richiesta."),
});
export type DatiEvasioneRichiesta = z.infer<typeof schemaEvasioneRichiesta>;

export const schemaRegistroTrattamento = z.object({
  nomeTrattamento: z.string().min(1, "Inserire il nome del trattamento."),
  finalita: z.string().min(1, "Inserire la finalità."),
  baseGiuridica: z.string().min(1, "Inserire la base giuridica."),
  categorieDati: z.string().min(1, "Inserire le categorie di dati trattati."),
  categorieInteressati: z.string().min(1, "Inserire le categorie di interessati."),
  destinatari: z.string().optional().or(z.literal("")),
  tempiConservazione: z.string().min(1, "Inserire i tempi di conservazione."),
  misureSicurezza: z.string().min(1, "Inserire le misure di sicurezza adottate."),
});
export type DatiRegistroTrattamento = z.infer<typeof schemaRegistroTrattamento>;

export const ETICHETTE_TIPI_CONSENSO: Record<string, string> = {
  trattamento_finalita_associative: "Trattamento dati per finalità associative",
  immagini_video: "Utilizzo di immagini e video",
  newsletter_promozionale: "Newsletter e comunicazioni promozionali",
  comunicazione_terzi: "Comunicazione dei dati a terzi",
};

export const MODALITA_REVOCA_CONSENSO = ["cartaceo_firmato_scansionato", "form_online"] as const;
export const ETICHETTE_MODALITA_REVOCA: Record<(typeof MODALITA_REVOCA_CONSENSO)[number], string> = {
  cartaceo_firmato_scansionato: "Richiesta scritta/firmata",
  form_online: "Richiesta online",
};

export const schemaRevocaConsenso = z.object({
  personaId: z.string().min(1, "Selezionare una persona."),
  tipo: z.string().min(1, "Selezionare il tipo di consenso."),
  modalita: z.enum(MODALITA_REVOCA_CONSENSO, { message: "Selezionare la modalità." }),
});
export type DatiRevocaConsenso = z.infer<typeof schemaRevocaConsenso>;
