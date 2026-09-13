import { z } from "zod";

export const schemaGeneraQuota = z.object({
  personaId: z.string().min(1),
  tipoQuotaId: z.string().min(1, "Selezionare un tipo di quota."),
  scadenza: z.string().min(1, "Inserire la scadenza."),
});
export type DatiGeneraQuota = z.infer<typeof schemaGeneraQuota>;

export const schemaGeneraQuoteMassivo = z.object({
  personaIds: z.array(z.string().min(1)).min(1, "Selezionare almeno un socio."),
  tipoQuotaId: z.string().min(1, "Selezionare un tipo di quota."),
  scadenza: z.string().min(1, "Inserire la scadenza."),
});
export type DatiGeneraQuoteMassivo = z.infer<typeof schemaGeneraQuoteMassivo>;
