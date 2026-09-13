import { z } from "zod";

// Tassonomia provvisoria delle voci di prima nota: una prima classificazione
// utile da subito per filtri e per il contatore delle entrate commerciali
// (§7.3). La mappatura puntuale sullo schema del Mod. D (DM 5/3/2020, aree
// di gestione A/B/C/D) è compito della milestone M6 ("Rendiconto per
// cassa"): qui non si inventa quello schema, si tengono solo le categorie
// necessarie a registrare correttamente i movimenti fin da ora.
export const CATEGORIE_RENDICONTO_ENTRATA = [
  "quote_associative",
  "corrispettivi_specifici",
  "erogazioni_liberali",
  "contributi_pubblici",
  "contributi_privati",
  "sponsorizzazioni",
  "raccolte_fondi",
  "attivita_commerciali",
  "altre_entrate",
] as const;

export const CATEGORIE_RENDICONTO_USCITA = [
  "acquisti_beni_servizi",
  "godimento_beni_terzi",
  "compensi_collaborazioni",
  "oneri_diversi_gestione",
  "erogazioni_liberali_effettuate",
  "imposte_tasse",
  "altre_uscite",
] as const;

export const ETICHETTE_CATEGORIE_RENDICONTO: Record<string, string> = {
  quote_associative: "Quote associative",
  corrispettivi_specifici: "Corrispettivi specifici",
  erogazioni_liberali: "Erogazioni liberali ricevute",
  contributi_pubblici: "Contributi pubblici",
  contributi_privati: "Contributi privati",
  sponsorizzazioni: "Sponsorizzazioni",
  raccolte_fondi: "Raccolte fondi",
  attivita_commerciali: "Attività commerciali",
  altre_entrate: "Altre entrate",
  acquisti_beni_servizi: "Acquisti di beni e servizi",
  godimento_beni_terzi: "Godimento di beni di terzi",
  compensi_collaborazioni: "Compensi e collaborazioni",
  oneri_diversi_gestione: "Oneri diversi di gestione",
  erogazioni_liberali_effettuate: "Erogazioni liberali effettuate",
  imposte_tasse: "Imposte e tasse",
  altre_uscite: "Altre uscite",
};

// Mappatura di default natura fiscale → categoria di rendiconto, usata per
// precompilare il movimento generato automaticamente da un pagamento
// (l'operatore la può comunque correggere se necessario in futuro).
export const CATEGORIA_RENDICONTO_DA_NATURA_FISCALE: Record<string, (typeof CATEGORIE_RENDICONTO_ENTRATA)[number]> = {
  quota_associativa: "quote_associative",
  corrispettivo_specifico: "corrispettivi_specifici",
  erogazione_liberale: "erogazioni_liberali",
  contributo_pubblico: "contributi_pubblici",
  contributo_privato: "contributi_privati",
  sponsorizzazione: "sponsorizzazioni",
  raccolta_fondi_occasionale: "raccolte_fondi",
  attivita_commerciale: "attivita_commerciali",
};

export const METODI_PAGAMENTO = ["contanti", "bonifico", "pos", "satispay", "paypal", "altro"] as const;
export const ETICHETTE_METODI_PAGAMENTO: Record<(typeof METODI_PAGAMENTO)[number], string> = {
  contanti: "Contanti",
  bonifico: "Bonifico",
  pos: "POS",
  satispay: "Satispay",
  paypal: "PayPal",
  altro: "Altro",
};

export const schemaConto = z.object({
  nome: z.string().min(1, "Inserire il nome del conto."),
  tipo: z.enum(["cassa", "banca"], { message: "Selezionare il tipo di conto." }),
  iban: z.string().optional().or(z.literal("")),
  saldoIniziale: z
    .string()
    .min(1, "Inserire il saldo iniziale.")
    .refine((v) => !Number.isNaN(Number(v)), "Il saldo iniziale deve essere un numero."),
});
export type DatiConto = z.infer<typeof schemaConto>;

export const schemaTipoQuota = z.object({
  descrizione: z.string().min(1, "Inserire una descrizione."),
  importo: z
    .string()
    .min(1, "Inserire l'importo.")
    .refine((v) => Number(v) > 0, "L'importo deve essere maggiore di zero."),
  categoriaSocioApplicabile: z.string().optional().or(z.literal("")),
  naturaFiscale: z.enum(
    [
      "quota_associativa",
      "corrispettivo_specifico",
      "erogazione_liberale",
      "contributo_pubblico",
      "contributo_privato",
      "sponsorizzazione",
      "raccolta_fondi_occasionale",
      "attivita_commerciale",
    ],
    { message: "Selezionare la natura fiscale." }
  ),
  ricorrente: z.boolean(),
});
export type DatiTipoQuota = z.infer<typeof schemaTipoQuota>;

export const schemaPagamento = z.object({
  importo: z
    .string()
    .min(1, "Inserire l'importo.")
    .refine((v) => Number(v) > 0, "L'importo deve essere maggiore di zero."),
  data: z.string().min(1, "Inserire la data."),
  metodo: z.enum(METODI_PAGAMENTO, { message: "Selezionare il metodo." }),
  contoId: z.string().min(1, "Selezionare il conto di destinazione."),
  note: z.string().optional().or(z.literal("")),
});
export type DatiPagamento = z.infer<typeof schemaPagamento>;

export const schemaMovimentoManuale = z
  .object({
    tipo: z.enum(["entrata", "uscita"]),
    data: z.string().min(1, "Inserire la data."),
    importo: z
      .string()
      .min(1, "Inserire l'importo.")
      .refine((v) => Number(v) > 0, "L'importo deve essere maggiore di zero."),
    contoId: z.string().min(1, "Selezionare il conto."),
    causale: z.string().min(1, "Inserire la causale."),
    categoriaRendiconto: z.string().min(1, "Selezionare la categoria."),
    descrizione: z.string().optional().or(z.literal("")),
    controparteFornitore: z.string().optional().or(z.literal("")),
    motivazioneAssenzaGiustificativo: z.string().optional().or(z.literal("")),
  })
  .refine(
    (dati) =>
      dati.tipo === "entrata" ||
      (CATEGORIE_RENDICONTO_USCITA as readonly string[]).includes(dati.categoriaRendiconto),
    { message: "Categoria non valida per un'uscita.", path: ["categoriaRendiconto"] }
  );
export type DatiMovimentoManuale = z.infer<typeof schemaMovimentoManuale>;

export const schemaStorno = z.object({
  motivoStorno: z.string().min(1, "Inserire il motivo dello storno."),
});
