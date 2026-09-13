/**
 * Saldo raccolto da una raccolta fondi: somma delle entrate meno le uscite
 * dei movimenti di prima nota collegati (stessa logica di `calcolaSaldoConto`,
 * qui senza saldo iniziale perché una raccolta fondi parte sempre da zero).
 */
export function calcolaSaldoRaccolta(movimenti: { tipo: string; importo: number }[]): number {
  return movimenti.reduce((saldo, m) => {
    if (m.tipo === "entrata") return saldo + m.importo;
    if (m.tipo === "uscita") return saldo - m.importo;
    return saldo;
  }, 0);
}
