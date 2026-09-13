import { z } from "zod";

export const schemaEmissioneTessera = z.object({
  socioId: z.string().min(1),
  annoSocialeId: z.string().min(1, "Selezionare l'anno sociale."),
});

export type DatiEmissioneTessera = z.infer<typeof schemaEmissioneTessera>;
