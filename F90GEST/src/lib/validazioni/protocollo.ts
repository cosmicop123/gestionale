import { z } from "zod";

export const TIPI_PROTOCOLLO = ["entrata", "uscita"] as const;
export const ETICHETTE_TIPI_PROTOCOLLO: Record<(typeof TIPI_PROTOCOLLO)[number], string> = {
  entrata: "Entrata",
  uscita: "Uscita",
};

export const MEZZI_PROTOCOLLO = ["pec", "email", "raccomandata", "brevi_manu"] as const;
export const ETICHETTE_MEZZI_PROTOCOLLO: Record<(typeof MEZZI_PROTOCOLLO)[number], string> = {
  pec: "PEC",
  email: "Email",
  raccomandata: "Raccomandata",
  brevi_manu: "Brevi manu",
};

export const schemaProtocollo = z.object({
  tipo: z.enum(TIPI_PROTOCOLLO, { message: "Selezionare il tipo." }),
  data: z.string().min(1, "Inserire la data."),
  mittenteDestinatario: z.string().min(1, "Inserire mittente o destinatario."),
  oggetto: z.string().min(1, "Inserire l'oggetto."),
  mezzo: z.enum(MEZZI_PROTOCOLLO, { message: "Selezionare il mezzo." }),
  classificazione: z.string().optional().or(z.literal("")),
});
export type DatiProtocollo = z.infer<typeof schemaProtocollo>;

export const CATEGORIE_DOCUMENTO = [
  "statuto",
  "atto_costitutivo",
  "verbali",
  "bilanci",
  "contratti",
  "assicurazioni",
  "moduli",
  "convenzioni",
] as const;
export const ETICHETTE_CATEGORIE_DOCUMENTO: Record<(typeof CATEGORIE_DOCUMENTO)[number], string> = {
  statuto: "Statuto",
  atto_costitutivo: "Atto costitutivo",
  verbali: "Verbali",
  bilanci: "Bilanci e rendiconti",
  contratti: "Contratti",
  assicurazioni: "Assicurazioni",
  moduli: "Moduli",
  convenzioni: "Convenzioni",
};

export const schemaDocumento = z.object({
  titolo: z.string().min(1, "Inserire il titolo del documento."),
  categoria: z.enum(CATEGORIE_DOCUMENTO, { message: "Selezionare la categoria." }),
  scadenza: z.string().optional().or(z.literal("")),
});
export type DatiDocumento = z.infer<typeof schemaDocumento>;
