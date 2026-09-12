import { z } from "zod";

export const schemaAnnoSociale = z
  .object({
    etichetta: z.string().min(1, "Inserire un'etichetta per l'anno sociale (es. 2026/2027)."),
    dataInizio: z.string().min(1, "Inserire la data di inizio."),
    dataFine: z.string().min(1, "Inserire la data di fine."),
  })
  .refine((dati) => new Date(dati.dataFine) > new Date(dati.dataInizio), {
    message: "La data di fine deve essere successiva alla data di inizio.",
    path: ["dataFine"],
  });

export type DatiAnnoSociale = z.infer<typeof schemaAnnoSociale>;
