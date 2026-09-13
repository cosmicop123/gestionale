import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer";
import type { Rendiconto } from "./calcola";

const stili = StyleSheet.create({
  pagina: { padding: 40, fontSize: 9, fontFamily: "Helvetica", color: "#111111" },
  intestazione: { marginBottom: 16, borderBottom: 1, borderBottomColor: "#cccccc", paddingBottom: 8 },
  denominazione: { fontSize: 13, fontWeight: 700 },
  titolo: { fontSize: 12, fontWeight: 700, marginTop: 6 },
  sottotitolo: { fontSize: 9, color: "#555555", marginTop: 2 },
  sezione: { marginTop: 14 },
  sezioneTitolo: { fontSize: 10, fontWeight: 700, backgroundColor: "#f0f0f0", padding: 4 },
  riga: { flexDirection: "row", paddingVertical: 2, paddingHorizontal: 4 },
  rigaTotale: { flexDirection: "row", paddingVertical: 3, paddingHorizontal: 4, borderTop: 0.5, borderTopColor: "#999999", fontWeight: 700 },
  colEtichetta: { flex: 3 },
  colValore: { flex: 1, textAlign: "right" },
  totaliGenerali: { marginTop: 20, borderTop: 1, borderTopColor: "#111111", paddingTop: 8 },
  avviso: { marginTop: 24, fontSize: 8, fontStyle: "italic", color: "#777777" },
  piePagina: { position: "absolute", bottom: 24, left: 40, fontSize: 8, color: "#999999" },
});

function formattaEuro(valore: number): string {
  return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(valore);
}

export type DatiRendicontoPdf = {
  denominazioneEnte: string;
  annoSocialeEtichetta: string;
  formaAggregata: boolean;
  rendiconto: Rendiconto;
  etichetteCategoria: Record<string, string>;
  etichetteSezione: Record<string, string>;
  saldoInizialeComplessivo: number;
  saldoFinaleComplessivo: number;
  dataGenerazione: string;
};

export function RendicontoDocument(dati: DatiRendicontoPdf) {
  return (
    <Document>
      <Page size="A4" style={stili.pagina}>
        <View style={stili.intestazione}>
          <Text style={stili.denominazione}>{dati.denominazioneEnte}</Text>
          <Text style={stili.titolo}>
            Rendiconto per cassa {dati.formaAggregata ? "in forma aggregata" : ""} — anno sociale{" "}
            {dati.annoSocialeEtichetta}
          </Text>
          <Text style={stili.sottotitolo}>Schema Mod. D (DM 5 marzo 2020) e Mod. E forma aggregata (DM 18 febbraio 2026)</Text>
        </View>

        {dati.rendiconto.sezioni.map((sezione) => (
          <View key={sezione.sezione} style={stili.sezione}>
            <Text style={stili.sezioneTitolo}>{dati.etichetteSezione[sezione.sezione]}</Text>
            {!dati.formaAggregata &&
              sezione.dettaglioEntrate.map((riga) => (
                <View key={`e-${riga.categoria}`} style={stili.riga}>
                  <Text style={stili.colEtichetta}>Entrate — {dati.etichetteCategoria[riga.categoria] ?? riga.categoria}</Text>
                  <Text style={stili.colValore}>{formattaEuro(riga.importo)}</Text>
                </View>
              ))}
            {!dati.formaAggregata &&
              sezione.dettaglioUscite.map((riga) => (
                <View key={`u-${riga.categoria}`} style={stili.riga}>
                  <Text style={stili.colEtichetta}>Uscite — {dati.etichetteCategoria[riga.categoria] ?? riga.categoria}</Text>
                  <Text style={stili.colValore}>{formattaEuro(riga.importo)}</Text>
                </View>
              ))}
            {dati.formaAggregata && (
              <>
                <View style={stili.riga}>
                  <Text style={stili.colEtichetta}>Totale entrate</Text>
                  <Text style={stili.colValore}>{formattaEuro(sezione.entrate)}</Text>
                </View>
                <View style={stili.riga}>
                  <Text style={stili.colEtichetta}>Totale uscite</Text>
                  <Text style={stili.colValore}>{formattaEuro(sezione.uscite)}</Text>
                </View>
              </>
            )}
            <View style={stili.rigaTotale}>
              <Text style={stili.colEtichetta}>Avanzo/disavanzo sezione</Text>
              <Text style={stili.colValore}>{formattaEuro(sezione.avanzo)}</Text>
            </View>
          </View>
        ))}

        <View style={stili.totaliGenerali}>
          <View style={stili.riga}>
            <Text style={stili.colEtichetta}>Totale entrate</Text>
            <Text style={stili.colValore}>{formattaEuro(dati.rendiconto.totaleEntrate)}</Text>
          </View>
          <View style={stili.riga}>
            <Text style={stili.colEtichetta}>Totale uscite</Text>
            <Text style={stili.colValore}>{formattaEuro(dati.rendiconto.totaleUscite)}</Text>
          </View>
          <View style={stili.rigaTotale}>
            <Text style={stili.colEtichetta}>Avanzo/disavanzo di esercizio</Text>
            <Text style={stili.colValore}>{formattaEuro(dati.rendiconto.avanzoDisavanzo)}</Text>
          </View>
          <View style={[stili.riga, { marginTop: 8 }]}>
            <Text style={stili.colEtichetta}>Cassa e banca all&apos;inizio del periodo</Text>
            <Text style={stili.colValore}>{formattaEuro(dati.saldoInizialeComplessivo)}</Text>
          </View>
          <View style={stili.riga}>
            <Text style={stili.colEtichetta}>Cassa e banca alla fine del periodo</Text>
            <Text style={stili.colValore}>{formattaEuro(dati.saldoFinaleComplessivo)}</Text>
          </View>
        </View>

        {dati.rendiconto.categorieNonMappate.length > 0 && (
          <Text style={[stili.avviso, { color: "#cc0000" }]}>
            Attenzione: categorie prive di sezione assegnata (importi inclusi nei totali generali ma non nelle
            sezioni A-E): {dati.rendiconto.categorieNonMappate.join(", ")}.
          </Text>
        )}
        <Text style={stili.avviso}>
          Documento generato automaticamente dai movimenti di prima nota registrati nel gestionale, secondo la
          mappatura categoria → sezione impostata dall&apos;associazione. Verificare con il proprio consulente
          prima dell&apos;approvazione da parte dell&apos;organo competente.
        </Text>

        <Text style={stili.piePagina}>Documento generato il {dati.dataGenerazione}</Text>
      </Page>
    </Document>
  );
}
