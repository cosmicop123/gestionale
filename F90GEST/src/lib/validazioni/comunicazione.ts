import { z } from "zod";

export const SEGMENTI_COMUNICAZIONE = ["soci_attivi", "iscritti_corso", "morosi", "volontari", "personalizzato"] as const;
export const ETICHETTE_SEGMENTI_COMUNICAZIONE: Record<(typeof SEGMENTI_COMUNICAZIONE)[number], string> = {
  soci_attivi: "Soci attivi",
  iscritti_corso: "Iscritti a un corso",
  morosi: "Soci con quote scadute non pagate",
  volontari: "Volontari",
  personalizzato: "Selezione personalizzata",
};

export const STATI_COMUNICAZIONE = ["bozza", "in_invio", "inviata"] as const;
export const ETICHETTE_STATI_COMUNICAZIONE: Record<(typeof STATI_COMUNICAZIONE)[number], string> = {
  bozza: "Bozza",
  in_invio: "Invio in corso",
  inviata: "Inviata",
};

export const schemaComunicazione = z
  .object({
    titolo: z.string().min(1, "Inserire un titolo."),
    segmento: z.enum(SEGMENTI_COMUNICAZIONE, { message: "Selezionare un segmento di destinatari." }),
    corsoId: z.string().optional().or(z.literal("")),
    personaIds: z.array(z.string()).optional(),
    templateOggetto: z.string().min(1, "Inserire l'oggetto dell'email."),
    templateCorpo: z.string().min(1, "Inserire il testo dell'email."),
  })
  .superRefine((dati, ctx) => {
    if (dati.segmento === "iscritti_corso" && !dati.corsoId) {
      ctx.addIssue({ code: "custom", path: ["corsoId"], message: "Selezionare un corso." });
    }
    if (dati.segmento === "personalizzato" && (!dati.personaIds || dati.personaIds.length === 0)) {
      ctx.addIssue({ code: "custom", path: ["personaIds"], message: "Selezionare almeno un destinatario." });
    }
  });
export type DatiComunicazione = z.infer<typeof schemaComunicazione>;

// Variabili disponibili nei template (§9): sempre nome/cognome, più variabili
// specifiche del segmento risolte da src/lib/comunicazione/destinatari.ts.
export const VARIABILI_TEMPLATE_PER_SEGMENTO: Record<(typeof SEGMENTI_COMUNICAZIONE)[number], string[]> = {
  soci_attivi: ["nome", "cognome"],
  iscritti_corso: ["nome", "cognome", "corso"],
  morosi: ["nome", "cognome", "importo", "scadenza"],
  volontari: ["nome", "cognome"],
  personalizzato: ["nome", "cognome"],
};
