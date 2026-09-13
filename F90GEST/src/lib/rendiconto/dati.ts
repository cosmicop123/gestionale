import "server-only";
import { prisma } from "@/lib/prisma";
import { ottieniParametriContabilita } from "@/lib/parametri";
import { calcolaRendiconto } from "./calcola";

/**
 * Raccoglie ed elabora tutti i dati del rendiconto per cassa di un anno
 * sociale, riusato sia dalla pagina di consultazione sia dalla generazione
 * del PDF (mai duplicare la query, §CLAUDE.md convenzioni).
 */
export async function ottieniDatiRendiconto(annoSocialeId: string) {
  const annoSociale = await prisma.annoSociale.findUniqueOrThrow({ where: { id: annoSocialeId } });

  const [parametri, conti, movimenti] = await Promise.all([
    ottieniParametriContabilita(),
    prisma.conto.findMany({
      where: { deletedAt: null },
      include: { saldiAnno: { where: { annoSocialeId } } },
    }),
    prisma.movimentoPrimaNota.findMany({
      where: { data: { gte: annoSociale.dataInizio, lte: annoSociale.dataFine } },
      select: { tipo: true, importo: true, categoriaRendiconto: true, ricavoCommerciale: true },
    }),
  ]);

  const saldoInizialeComplessivo = conti.reduce(
    (somma, conto) => somma + Number(conto.saldiAnno[0]?.saldoIniziale ?? 0),
    0
  );

  const rendiconto = calcolaRendiconto(
    movimenti.map((m) => ({
      tipo: m.tipo as "entrata" | "uscita",
      importo: Number(m.importo),
      categoriaRendiconto: m.categoriaRendiconto,
    })),
    parametri.mappaturaCategorieRendiconto,
    parametri.rendicontoFormaAggregata
  );

  // Report parametrico sulla natura fiscale (§7.3): solo un'esposizione dei
  // movimenti già segnati come potenzialmente commerciali al momento della
  // registrazione (§8 M3), mai una qualificazione fiscale automatica.
  const entrateCommerciali = movimenti
    .filter((m) => m.tipo === "entrata" && m.ricavoCommerciale)
    .reduce((somma, m) => somma + Number(m.importo), 0);

  return {
    annoSociale,
    formaAggregata: parametri.rendicontoFormaAggregata,
    mappaturaCategorieRendiconto: parametri.mappaturaCategorieRendiconto,
    rendiconto,
    saldoInizialeComplessivo,
    saldoFinaleComplessivo: saldoInizialeComplessivo + rendiconto.avanzoDisavanzo,
    entrateCommerciali,
  };
}
