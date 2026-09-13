const FORMATO_DATA = new Intl.DateTimeFormat("it-IT", { day: "numeric", month: "long", year: "numeric" });

export function formattaPeriodoCorso(dataInizio: Date, dataFine: Date | null): string {
  if (!dataFine || dataFine.getTime() === dataInizio.getTime()) {
    return `dal ${FORMATO_DATA.format(dataInizio)}`;
  }
  return `dal ${FORMATO_DATA.format(dataInizio)} al ${FORMATO_DATA.format(dataFine)}`;
}

export function formattaData(data: Date): string {
  return FORMATO_DATA.format(data);
}
