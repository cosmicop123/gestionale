import "server-only";
import { prisma } from "@/lib/prisma";

/**
 * Parametri di contabilità non hardcoded (§3.4): letti dalla tabella
 * Parametro, con default di ripiego solo per non far crashare l'app se una
 * chiave manca (non dovrebbe succedere, il seed li crea tutti).
 */
export async function ottieniParametriContabilita() {
  const righe = await prisma.parametro.findMany({
    where: {
      chiave: {
        in: [
          "contabilita.soglia_bollo_euro",
          "contabilita.importo_bollo_euro",
          "contabilita.soglia_giustificativo_obbligatorio_euro",
          "contabilita.rendiconto_forma_aggregata",
          "contabilita.nature_fiscali_soggette_a_bollo",
        ],
      },
    },
  });
  const mappa = new Map(righe.map((r) => [r.chiave, r.valore]));

  return {
    sogliaBolloEuro: Number(mappa.get("contabilita.soglia_bollo_euro") ?? "77.47"),
    importoBolloEuro: Number(mappa.get("contabilita.importo_bollo_euro") ?? "2.00"),
    sogliaGiustificativoObbligatorioEuro: Number(
      mappa.get("contabilita.soglia_giustificativo_obbligatorio_euro") ?? "100.00"
    ),
    rendicontoFormaAggregata: mappa.get("contabilita.rendiconto_forma_aggregata") !== "false",
    natureFiscaliSoggetteABollo: JSON.parse(
      mappa.get("contabilita.nature_fiscali_soggette_a_bollo") ?? '["corrispettivo_specifico","attivita_commerciale"]'
    ) as string[],
  };
}
