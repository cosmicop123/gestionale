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
          "contabilita.mappatura_categorie_rendiconto",
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
    mappaturaCategorieRendiconto: JSON.parse(
      mappa.get("contabilita.mappatura_categorie_rendiconto") ?? JSON.stringify(MAPPATURA_RENDICONTO_DEFAULT)
    ) as Record<string, string>,
  };
}

// Default ragionevole, non vincolante (§12): l'associazione lo rivede da
// Contabilità → Rendiconto in base alla propria situazione reale.
export const MAPPATURA_RENDICONTO_DEFAULT: Record<string, string> = {
  quote_associative: "A",
  corrispettivi_specifici: "A",
  erogazioni_liberali: "A",
  contributi_pubblici: "A",
  contributi_privati: "A",
  sponsorizzazioni: "B",
  raccolte_fondi: "C",
  attivita_commerciali: "B",
  altre_entrate: "E",
  acquisti_beni_servizi: "A",
  godimento_beni_terzi: "E",
  compensi_collaborazioni: "E",
  oneri_diversi_gestione: "E",
  erogazioni_liberali_effettuate: "A",
  imposte_tasse: "E",
  altre_uscite: "E",
};
