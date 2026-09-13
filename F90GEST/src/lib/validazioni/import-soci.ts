import { validaCodiceFiscale } from "@/lib/persona/codice-fiscale";
import { CATEGORIE_SOCIO } from "@/lib/validazioni/socio";

// Campi che l'operatore può mappare dalle colonne del file Excel/CSV.
export const CAMPI_IMPORT_SOCI = [
  "nome",
  "cognome",
  "codiceFiscale",
  "dataNascita",
  "email",
  "telefono",
  "numeroLibroSoci",
  "categoria",
  "dataDecorrenza",
] as const;

export type CampoImportSoci = (typeof CAMPI_IMPORT_SOCI)[number];

export const ETICHETTE_CAMPI_IMPORT: Record<CampoImportSoci, string> = {
  nome: "Nome *",
  cognome: "Cognome *",
  codiceFiscale: "Codice fiscale",
  dataNascita: "Data di nascita",
  email: "Email",
  telefono: "Telefono",
  numeroLibroSoci: "N. libro soci (se già assegnato)",
  categoria: "Categoria socio",
  dataDecorrenza: "Socio dal (data decorrenza)",
};

export const CAMPI_OBBLIGATORI: CampoImportSoci[] = ["nome", "cognome"];

export type RigaGrezzaImport = Partial<Record<CampoImportSoci, string>>;

export type RigaValidataImport = {
  indiceOriginale: number;
  valida: boolean;
  errori: string[];
  dati: {
    nome: string;
    cognome: string;
    codiceFiscale: string | null;
    dataNascita: Date | null;
    email: string | null;
    telefono: string | null;
    numeroLibroSoci: number | null;
    categoria: string;
    dataDecorrenza: Date;
  };
};

function parseDataFlessibile(valore: string | undefined): Date | null {
  if (!valore || !valore.trim()) return null;
  const testo = valore.trim();

  // Formati italiani comuni gg/mm/aaaa o gg-mm-aaaa, oltre all'ISO aaaa-mm-gg.
  const matchItaliano = testo.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (matchItaliano) {
    const [, giorno, mese, anno] = matchItaliano;
    const data = new Date(Number(anno), Number(mese) - 1, Number(giorno));
    return Number.isNaN(data.getTime()) ? null : data;
  }

  const data = new Date(testo);
  return Number.isNaN(data.getTime()) ? null : data;
}

/**
 * Valida una riga grezza (già mappata sui campi noti) importata da
 * Excel/CSV: nome/cognome obbligatori, codice fiscale controllato con lo
 * stesso algoritmo dell'anagrafica manuale (§6 M2: "validazione riga per
 * riga"). Le righe non valide vengono segnalate ma non bloccano le altre.
 */
export function validaRigaImport(riga: RigaGrezzaImport, indiceOriginale: number): RigaValidataImport {
  const errori: string[] = [];

  const nome = riga.nome?.trim() ?? "";
  const cognome = riga.cognome?.trim() ?? "";
  if (!nome) errori.push("Nome mancante.");
  if (!cognome) errori.push("Cognome mancante.");

  const dataNascita = parseDataFlessibile(riga.dataNascita);
  if (riga.dataNascita?.trim() && !dataNascita) {
    errori.push("Data di nascita non riconosciuta.");
  }

  const codiceFiscaleGrezzo = riga.codiceFiscale?.trim().toUpperCase() || "";
  let codiceFiscale: string | null = null;
  if (codiceFiscaleGrezzo) {
    const risultatoCf = validaCodiceFiscale(codiceFiscaleGrezzo, {
      dataNascita: dataNascita ?? undefined,
    });
    if (!risultatoCf.valido) {
      errori.push(...risultatoCf.errori.map((e) => `Codice fiscale: ${e}`));
    } else {
      codiceFiscale = codiceFiscaleGrezzo;
    }
  }

  const email = riga.email?.trim() || null;
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errori.push("Email non valida.");
  }

  let numeroLibroSoci: number | null = null;
  if (riga.numeroLibroSoci?.trim()) {
    const numero = Number(riga.numeroLibroSoci.trim());
    if (!Number.isInteger(numero) || numero <= 0) {
      errori.push("Numero libro soci non valido: deve essere un intero positivo.");
    } else {
      numeroLibroSoci = numero;
    }
  }

  const categoriaGrezza = riga.categoria?.trim().toLowerCase() || "ordinario";
  const categoria = (CATEGORIE_SOCIO as readonly string[]).includes(categoriaGrezza)
    ? categoriaGrezza
    : "ordinario";

  const dataDecorrenza = parseDataFlessibile(riga.dataDecorrenza) ?? new Date();

  return {
    indiceOriginale,
    valida: errori.length === 0,
    errori,
    dati: {
      nome,
      cognome,
      codiceFiscale,
      dataNascita,
      email,
      telefono: riga.telefono?.trim() || null,
      numeroLibroSoci,
      categoria,
      dataDecorrenza,
    },
  };
}
