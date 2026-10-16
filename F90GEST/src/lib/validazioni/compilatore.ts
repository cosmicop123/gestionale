import { z } from "zod";

export const schemaSalvaComunicazione = z.object({
  titolo: z.string().min(1, "Inserire un titolo per il documento."),
  corpoHtml: z.string().min(1, "Il documento è vuoto."),
  categoria: z.string().min(1, "Selezionare una categoria."),
});
export type DatiSalvaComunicazione = z.infer<typeof schemaSalvaComunicazione>;
