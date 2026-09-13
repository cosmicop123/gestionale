/**
 * L'appartenenza alla minore età NON è persistita come colonna nel DB
 * (evita disallineamenti nel tempo): si calcola sempre a runtime da
 * dataNascita rispetto a "adesso" (§5.2 della specifica).
 */
export function calcolaEta(dataNascita: Date, riferimento: Date = new Date()): number {
  let eta = riferimento.getFullYear() - dataNascita.getFullYear();
  const primaCompleannoQuestAnno =
    riferimento.getMonth() < dataNascita.getMonth() ||
    (riferimento.getMonth() === dataNascita.getMonth() && riferimento.getDate() < dataNascita.getDate());
  if (primaCompleannoQuestAnno) eta -= 1;
  return eta;
}

export function isMinorenne(dataNascita: Date, riferimento: Date = new Date()): boolean {
  return calcolaEta(dataNascita, riferimento) < 18;
}
