import "server-only";
import type { Prisma } from "@prisma/client";

/**
 * Incrementa e restituisce il numero progressivo successivo per una
 * numerazione (libro soci, ricevute, protocollo, attestati...), sempre
 * dentro una transazione del chiamante: così l'assegnazione del numero e la
 * scrittura della riga che lo usa sono atomiche, evitando buchi o
 * duplicati sotto scritture concorrenti (§7.1, §7.4, §5.4 della specifica).
 *
 * `annoRiferimento` è null per le numerazioni non annuali (es. libro soci).
 */
export async function prossimoNumero(
  tx: Prisma.TransactionClient,
  entita: string,
  annoRiferimento: number | null = null
): Promise<number> {
  const esistente = await tx.numeratore.findFirst({
    where: { entita, annoRiferimento },
  });

  if (!esistente) {
    // Nota: l'indice composto (entita, annoRiferimento) non accetta null
    // nella where clause di un upsert (vedi CLAUDE.md), quindi qui si usa
    // find-then-create/update esplicito anche per l'incremento.
    await tx.numeratore.create({ data: { entita, annoRiferimento, ultimoNumero: 1 } });
    return 1;
  }

  const aggiornato = await tx.numeratore.update({
    where: { id: esistente.id },
    data: { ultimoNumero: { increment: 1 } },
  });
  return aggiornato.ultimoNumero;
}
