/**
 * Validazione algoritmica del codice fiscale delle persone fisiche (§5.2,
 * §7 della specifica): checksum ufficiale + coerenza con data di nascita e
 * sesso dichiarati. Gestisce anche l'omocodia (sostituzione di cifre con
 * lettere quando il codice numerico coinciderebbe con uno già assegnato).
 *
 * Limite dichiarato: NON verifica il codice catastale del comune di nascita
 * (le ultime 4 posizioni prima del carattere di controllo) contro un elenco
 * ufficiale dei comuni italiani — richiederebbe una tabella di ~8000 codici
 * Belfiore che non è stato possibile procurarsi/validare in questa sede
 * (§12: "non inventare dati incerti"). Il campo resta quindi verificato solo
 * nella forma (una lettera + tre cifre), non nel contenuto.
 */

const TABELLA_DISPARI: Record<string, number> = {
  "0": 1, "1": 0, "2": 5, "3": 7, "4": 9, "5": 13, "6": 15, "7": 17, "8": 19, "9": 21,
  A: 1, B: 0, C: 5, D: 7, E: 9, F: 13, G: 15, H: 17, I: 19, J: 21, K: 2, L: 4, M: 18,
  N: 20, O: 11, P: 3, Q: 6, R: 8, S: 12, T: 14, U: 16, V: 10, W: 22, X: 25, Y: 24, Z: 23,
};

const TABELLA_PARI: Record<string, number> = {
  "0": 0, "1": 1, "2": 2, "3": 3, "4": 4, "5": 5, "6": 6, "7": 7, "8": 8, "9": 9,
  A: 0, B: 1, C: 2, D: 3, E: 4, F: 5, G: 6, H: 7, I: 8, J: 9, K: 10, L: 11, M: 12,
  N: 13, O: 14, P: 15, Q: 16, R: 17, S: 18, T: 19, U: 20, V: 21, W: 22, X: 23, Y: 24, Z: 25,
};

const ALFABETO = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

const MESI_PER_LETTERA: Record<string, number> = {
  A: 1, B: 2, C: 3, D: 4, E: 5, H: 6, L: 7, M: 8, P: 9, R: 10, S: 11, T: 12,
};

// Omocodia: alle posizioni numeriche (indici 0-based 6,7,9,10,12,13,14 del
// codice a 15 caratteri) una cifra può essere sostituita da una lettera.
const SOSTITUZIONE_OMOCODIA_LETTERA_A_CIFRA: Record<string, string> = {
  L: "0", M: "1", N: "2", P: "3", Q: "4", R: "5", S: "6", T: "7", U: "8", V: "9",
};
const POSIZIONI_OMOCODIA = [6, 7, 9, 10, 12, 13, 14];

// Le posizioni numeriche (anno, giorno, parte numerica del comune) accettano
// anche le lettere di omocodia al posto della cifra (vedi tabella sopra):
// la forma resta valida anche quando quelle cifre sono state sostituite.
const CIFRA_O_OMOCODIA = "[0-9LMNPQRSTUV]";
const REGEX_FORMATO = new RegExp(
  `^[A-Z]{6}${CIFRA_O_OMOCODIA}{2}[A-EHLMPRST]${CIFRA_O_OMOCODIA}{2}[A-Z]${CIFRA_O_OMOCODIA}{3}[A-Z]$`
);

export function calcolaCarattereControllo(primi15Caratteri: string): string {
  let somma = 0;
  for (let i = 0; i < 15; i++) {
    const carattere = primi15Caratteri[i];
    const valore = i % 2 === 0 ? TABELLA_DISPARI[carattere] : TABELLA_PARI[carattere];
    if (valore === undefined) {
      throw new Error(`Carattere non valido nel codice fiscale: "${carattere}"`);
    }
    somma += valore;
  }
  return ALFABETO[somma % 26];
}

export type EsitoDecodificaCodiceFiscale = {
  annoADueCifre: number;
  mese: number;
  giorno: number;
  sesso: "M" | "F";
};

/**
 * Decodifica anno (a due cifre, il secolo resta ambiguo), mese, giorno e
 * sesso dalle posizioni 6-10 del codice fiscale, applicando la sostituzione
 * per omocodia dove necessario.
 */
export function decodificaCodiceFiscale(codiceFiscale: string): EsitoDecodificaCodiceFiscale | null {
  const cf = codiceFiscale.toUpperCase();
  if (!REGEX_FORMATO.test(cf)) return null;

  const caratteri = cf.split("");
  for (const posizione of POSIZIONI_OMOCODIA) {
    const carattere = caratteri[posizione];
    if (/[A-Z]/.test(carattere)) {
      const cifra = SOSTITUZIONE_OMOCODIA_LETTERA_A_CIFRA[carattere];
      if (cifra === undefined) return null;
      caratteri[posizione] = cifra;
    }
  }

  const annoADueCifre = Number(caratteri[6] + caratteri[7]);
  const mese = MESI_PER_LETTERA[cf[8]];
  const giornoGrezzo = Number(caratteri[9] + caratteri[10]);
  if (!mese || Number.isNaN(annoADueCifre) || Number.isNaN(giornoGrezzo)) return null;

  const sesso: "M" | "F" = giornoGrezzo > 40 ? "F" : "M";
  const giorno = sesso === "F" ? giornoGrezzo - 40 : giornoGrezzo;
  if (giorno < 1 || giorno > 31) return null;

  return { annoADueCifre, mese, giorno, sesso };
}

export type RisultatoValidazioneCodiceFiscale = {
  valido: boolean;
  errori: string[];
};

/**
 * Validazione completa: formato + checksum + (se forniti) coerenza con
 * data di nascita e sesso dichiarati in anagrafica.
 */
export function validaCodiceFiscale(
  codiceFiscaleGrezzo: string,
  datiAnagrafici?: { dataNascita?: Date | null; sesso?: string | null }
): RisultatoValidazioneCodiceFiscale {
  const errori: string[] = [];
  const cf = codiceFiscaleGrezzo.trim().toUpperCase();

  if (!REGEX_FORMATO.test(cf)) {
    return { valido: false, errori: ["Il codice fiscale non rispetta il formato previsto (16 caratteri)."] };
  }

  const carattereAtteso = calcolaCarattereControllo(cf.slice(0, 15));
  if (carattereAtteso !== cf[15]) {
    errori.push("Il carattere di controllo del codice fiscale non è corretto.");
  }

  if (datiAnagrafici?.dataNascita || datiAnagrafici?.sesso) {
    const decodifica = decodificaCodiceFiscale(cf);
    if (!decodifica) {
      errori.push("Impossibile decodificare data di nascita e sesso dal codice fiscale.");
    } else {
      if (datiAnagrafici.dataNascita) {
        const data = datiAnagrafici.dataNascita;
        const annoAtteso = data.getFullYear() % 100;
        const meseAtteso = data.getMonth() + 1;
        const giornoAtteso = data.getDate();
        if (
          decodifica.annoADueCifre !== annoAtteso ||
          decodifica.mese !== meseAtteso ||
          decodifica.giorno !== giornoAtteso
        ) {
          errori.push("Il codice fiscale non è coerente con la data di nascita indicata.");
        }
      }
      if (datiAnagrafici.sesso && datiAnagrafici.sesso !== decodifica.sesso) {
        errori.push("Il codice fiscale non è coerente con il sesso indicato.");
      }
    }
  }

  return { valido: errori.length === 0, errori };
}
