import { z } from "zod";
import { validaCodiceFiscale } from "@/lib/persona/codice-fiscale";
import { isMinorenne } from "@/lib/persona/eta";
import { schemaGenitore } from "./persona";

export const CANALI_IMMAGINI = ["sito", "facebook", "instagram", "locandine", "stampa"] as const;
export const ETICHETTE_CANALI_IMMAGINI: Record<(typeof CANALI_IMMAGINI)[number], string> = {
  sito: "Sito web dell'associazione",
  facebook: "Facebook",
  instagram: "Instagram",
  locandine: "Locandine e materiale stampato",
  stampa: "Comunicati stampa",
};

/**
 * Dati del modulo pubblico di iscrizione a un corso (§6 M5). I consensi sono
 * volutamente campi booleani SEPARATI (mai un consenso unico che copra più
 * finalità, §7.5): solo il trattamento dati necessario a gestire
 * l'iscrizione è obbligatorio, gli altri restano facoltativi e non
 * preselezionati (il valore di default nel form è sempre `false`).
 */
export const schemaIscrizionePubblica = z
  .object({
    nome: z.string().min(1, "Inserire il nome."),
    cognome: z.string().min(1, "Inserire il cognome."),
    codiceFiscale: z.string().min(1, "Inserire il codice fiscale."),
    dataNascita: z.string().min(1, "Inserire la data di nascita."),
    sesso: z.enum(["M", "F"]).optional(),
    email: z.string().email("Email non valida.").optional().or(z.literal("")),
    telefono: z.string().optional().or(z.literal("")),
    genitore: schemaGenitore.optional(),
    consensoTrattamento: z.boolean().refine((v) => v === true, {
      message: "È necessario accettare il trattamento dei dati per poter gestire l'iscrizione.",
    }),
    consensoImmagini: z.boolean(),
    canaliImmagini: z.array(z.enum(CANALI_IMMAGINI)).optional(),
    consensoNewsletter: z.boolean(),
    consensoTerzi: z.boolean(),
  })
  .superRefine((dati, ctx) => {
    const dataNascita = new Date(dati.dataNascita);
    const risultatoCf = validaCodiceFiscale(dati.codiceFiscale, { dataNascita, sesso: dati.sesso });
    if (!risultatoCf.valido) {
      for (const errore of risultatoCf.errori) {
        ctx.addIssue({ code: "custom", path: ["codiceFiscale"], message: errore });
      }
    }

    if (isMinorenne(dataNascita) && !dati.genitore) {
      ctx.addIssue({
        code: "custom",
        path: ["genitore"],
        message:
          "Per una persona minorenne è obbligatorio indicare i dati di un genitore o tutore, che dovrà firmare i consensi.",
      });
    }

    if (!dati.email && !dati.telefono) {
      ctx.addIssue({
        code: "custom",
        path: ["email"],
        message: "Inserire almeno un contatto (email o telefono) per essere ricontattati.",
      });
    }

    if (dati.consensoImmagini && (!dati.canaliImmagini || dati.canaliImmagini.length === 0)) {
      ctx.addIssue({
        code: "custom",
        path: ["canaliImmagini"],
        message: "Selezionare almeno un canale per l'utilizzo di immagini e video.",
      });
    }
  });
export type DatiIscrizionePubblica = z.infer<typeof schemaIscrizionePubblica>;
