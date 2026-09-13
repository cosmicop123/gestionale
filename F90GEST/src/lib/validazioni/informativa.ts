import { z } from "zod";

// Il testo dell'informativa privacy va scritto dall'associazione (o da un
// suo consulente/DPO): il software non genera né propone un testo
// precompilato, per non fornire consulenza legale (§12).
export const schemaInformativa = z.object({
  testo: z.string().min(1, "Inserire il testo dell'informativa privacy."),
});
export type DatiInformativa = z.infer<typeof schemaInformativa>;
