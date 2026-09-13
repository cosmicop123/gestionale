import { z } from "zod";

// Categorie socio (configurabili via Parametro in futuro, per ora elenco
// fisso — §5.2 della specifica).
export const CATEGORIE_SOCIO = ["ordinario", "sostenitore", "onorario", "junior"] as const;

export const ETICHETTE_CATEGORIE_SOCIO: Record<(typeof CATEGORIE_SOCIO)[number], string> = {
  ordinario: "Ordinario",
  sostenitore: "Sostenitore",
  onorario: "Onorario",
  junior: "Junior",
};

export const schemaDomandaAmmissione = z.object({
  personaId: z.string().min(1),
  dataDomanda: z.string().min(1, "Inserire la data della domanda."),
  categoriaProposta: z.enum(CATEGORIE_SOCIO, { message: "Selezionare una categoria." }),
  note: z.string().optional().or(z.literal("")),
});

export type DatiDomandaAmmissione = z.infer<typeof schemaDomandaAmmissione>;

export const schemaApprovazioneDomanda = z.object({
  dataDelibera: z.string().min(1, "Inserire la data della delibera."),
  dataDecorrenza: z.string().min(1, "Inserire la data di decorrenza dell'iscrizione."),
  categoria: z.enum(CATEGORIE_SOCIO, { message: "Selezionare una categoria." }),
});

export type DatiApprovazioneDomanda = z.infer<typeof schemaApprovazioneDomanda>;

export const schemaRigettoDomanda = z.object({
  motivoRigetto: z.string().min(1, "Inserire il motivo del rigetto."),
});
