import { z } from "zod";

// Schema condiviso client/server per il form di accesso. La logica di
// verifica delle credenziali (hash argon2, sessione httpOnly) arriva con M1.
export const schemaAccesso = z.object({
  email: z
    .string()
    .min(1, "Inserire l'indirizzo email.")
    .email("Indirizzo email non valido."),
  password: z.string().min(1, "Inserire la password."),
});

export type DatiAccesso = z.infer<typeof schemaAccesso>;
