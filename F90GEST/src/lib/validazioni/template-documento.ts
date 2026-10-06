import { z } from "zod";

export const schemaTemplateDocumento = z.object({
  nome: z.string().min(1, "Inserire un nome per il modello."),
  descrizione: z.string().optional().or(z.literal("")),
  corpoTesto: z.string().min(1, "Inserire il testo del modello."),
});
export type DatiTemplateDocumento = z.infer<typeof schemaTemplateDocumento>;

export const schemaGenerazioneTemplate = z.object({
  valori: z.record(z.string(), z.string()),
  salvaInArchivio: z.boolean(),
  titoloDocumento: z.string().optional().or(z.literal("")),
  categoria: z.string().optional().or(z.literal("")),
});
export type DatiGenerazioneTemplate = z.infer<typeof schemaGenerazioneTemplate>;
