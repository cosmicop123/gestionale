import { z } from "zod";
import { validaCodiceFiscale } from "@/lib/persona/codice-fiscale";
import { isMinorenne } from "@/lib/persona/eta";

const schemaGenitore = z.object({
  genitoreNomeCognome: z.string().min(1, "Inserire nome e cognome dell'esercente la responsabilità genitoriale."),
  genitoreCodiceFiscale: z.string().optional().or(z.literal("")),
  genitoreEmail: z.string().email("Email non valida.").optional().or(z.literal("")),
  genitoreTelefono: z.string().optional().or(z.literal("")),
  gradoParentela: z.enum(["genitore", "tutore", "altro_esercente"]),
});

export const schemaPersona = z
  .object({
    nome: z.string().min(1, "Inserire il nome."),
    cognome: z.string().min(1, "Inserire il cognome."),
    codiceFiscale: z.string().min(1, "Inserire il codice fiscale."),
    dataNascita: z.string().optional().or(z.literal("")),
    comuneNascita: z.string().optional().or(z.literal("")),
    provinciaNascita: z.string().optional().or(z.literal("")),
    sesso: z.enum(["M", "F"]).optional(),
    residenzaVia: z.string().optional().or(z.literal("")),
    residenzaCap: z.string().regex(/^\d{5}$/, "Il CAP deve essere di 5 cifre.").optional().or(z.literal("")),
    residenzaComune: z.string().optional().or(z.literal("")),
    residenzaProvincia: z.string().length(2).toUpperCase().optional().or(z.literal("")),
    email: z.string().email("Email non valida.").optional().or(z.literal("")),
    telefono: z.string().optional().or(z.literal("")),
    note: z.string().optional().or(z.literal("")),
    // Presente solo se dataNascita indica un minorenne: vedi §7.5.
    genitore: schemaGenitore.optional(),
  })
  .superRefine((dati, ctx) => {
    const dataNascita = dati.dataNascita ? new Date(dati.dataNascita) : undefined;
    const risultatoCf = validaCodiceFiscale(dati.codiceFiscale, {
      dataNascita,
      sesso: dati.sesso,
    });
    if (!risultatoCf.valido) {
      for (const errore of risultatoCf.errori) {
        ctx.addIssue({ code: "custom", path: ["codiceFiscale"], message: errore });
      }
    }

    if (dataNascita && isMinorenne(dataNascita) && !dati.genitore) {
      ctx.addIssue({
        code: "custom",
        path: ["genitore"],
        message:
          "Per un minorenne è obbligatorio indicare almeno un esercente la responsabilità genitoriale.",
      });
    }
  });

export type DatiPersona = z.infer<typeof schemaPersona>;
