/**
 * Saldo di un conto in un dato periodo: saldo iniziale più le entrate meno
 * le uscite dei movimenti di prima nota del periodo (§7.2: il saldo finale
 * di un esercizio diventa il saldo iniziale del successivo).
 */
export function calcolaSaldoConto(
  saldoIniziale: number,
  movimenti: { tipo: string; importo: number }[]
): number {
  return movimenti.reduce((saldo, m) => {
    if (m.tipo === "entrata") return saldo + m.importo;
    if (m.tipo === "uscita") return saldo - m.importo;
    return saldo;
  }, saldoIniziale);
}
