/**
 * Genera automaticamente il calendario delle lezioni di un corso: data
 * inizio + cadenza settimanale (uno o più giorni della settimana) + numero
 * di lezioni previste, escludendo le festività indicate (§6 M4). Funzione
 * pura, senza accesso al DB, per poterla testare isolatamente.
 */
export type ParametriCalendario = {
  dataInizio: Date;
  numeroLezioni: number;
  /** Giorni della settimana della cadenza: 0 = domenica ... 6 = sabato. */
  giorniSettimana: number[];
  /** Date da escludere (festività, chiusure locale...), confrontate per giorno solare. */
  festivita?: Date[];
};

function stessoGiorno(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function generaCalendarioLezioni(parametri: ParametriCalendario): Date[] {
  if (parametri.giorniSettimana.length === 0) {
    throw new Error("Indicare almeno un giorno della settimana per la cadenza del corso.");
  }
  if (parametri.numeroLezioni <= 0) {
    throw new Error("Il numero di lezioni deve essere maggiore di zero.");
  }

  const festivita = parametri.festivita ?? [];
  const date: Date[] = [];
  const cursore = new Date(parametri.dataInizio);
  // Limite di sicurezza per non entrare in un ciclo indefinito con
  // parametri incoerenti (es. tutte le date coincidenti con festività).
  const massimoIterazioni = parametri.numeroLezioni * 7 + 366;

  for (let i = 0; i < massimoIterazioni && date.length < parametri.numeroLezioni; i++) {
    if (
      parametri.giorniSettimana.includes(cursore.getDay()) &&
      !festivita.some((f) => stessoGiorno(f, cursore))
    ) {
      date.push(new Date(cursore));
    }
    cursore.setDate(cursore.getDate() + 1);
  }

  if (date.length < parametri.numeroLezioni) {
    throw new Error("Impossibile generare il numero di lezioni richiesto entro un anno: verificare i parametri.");
  }

  return date;
}
