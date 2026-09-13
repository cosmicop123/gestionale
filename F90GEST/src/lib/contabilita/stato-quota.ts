/**
 * Stato di una quota in funzione dei pagamenti ricevuti. Gli stati `esente`
 * e `stornata` sono decisioni manuali dell'operatore e non derivano da
 * questo calcolo (§5.3).
 */
export function calcolaStatoQuota(importoQuota: number, totalePagamenti: number): "da_pagare" | "parziale" | "pagata" {
  if (totalePagamenti <= 0) return "da_pagare";
  if (totalePagamenti >= importoQuota) return "pagata";
  return "parziale";
}
