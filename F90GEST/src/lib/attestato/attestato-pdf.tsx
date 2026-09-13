import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer";

const stili = StyleSheet.create({
  pagina: { padding: 56, fontSize: 11, fontFamily: "Helvetica", color: "#111111" },
  intestazione: { marginBottom: 32, borderBottom: 1, borderBottomColor: "#cccccc", paddingBottom: 12 },
  denominazione: { fontSize: 14, fontWeight: 700 },
  datiEnte: { fontSize: 9, color: "#555555", marginTop: 2 },
  titolo: { fontSize: 20, fontWeight: 700, marginBottom: 8, textAlign: "center" },
  numero: { fontSize: 10, textAlign: "center", marginBottom: 32, color: "#555555" },
  corpo: { fontSize: 12, lineHeight: 1.8, textAlign: "center", marginBottom: 32 },
  nome: { fontSize: 16, fontWeight: 700 },
  riga: { flexDirection: "row", marginBottom: 8, justifyContent: "center", gap: 6 },
  etichetta: { color: "#555555" },
  valore: { fontWeight: 700 },
  piePagina: { marginTop: 56, fontSize: 8, color: "#777777" },
  firma: { marginTop: 56, textAlign: "right" },
});

export type DatiAttestatoPdf = {
  denominazioneEnte: string;
  codiceFiscaleEnte: string;
  sedeEnte: string;
  numero: number;
  personaNome: string;
  corsoTitolo: string;
  corsoEdizione: string | null;
  oreFrequentate: string;
  percentualePresenza: string;
  dataEmissione: string;
  dataGenerazione: string;
};

export function AttestatoDocument(dati: DatiAttestatoPdf) {
  return (
    <Document>
      <Page size="A4" style={stili.pagina}>
        <View style={stili.intestazione}>
          <Text style={stili.denominazione}>{dati.denominazioneEnte}</Text>
          <Text style={stili.datiEnte}>
            {dati.sedeEnte} — C.F. {dati.codiceFiscaleEnte}
          </Text>
        </View>

        <Text style={stili.titolo}>Attestato di frequenza</Text>
        <Text style={stili.numero}>n. {dati.numero} del {dati.dataEmissione}</Text>

        <View style={stili.corpo}>
          <Text style={stili.nome}>{dati.personaNome}</Text>
          <Text style={{ marginTop: 16 }}>
            ha frequentato il corso &quot;{dati.corsoTitolo}
            {dati.corsoEdizione ? ` — ${dati.corsoEdizione}` : ""}&quot;
          </Text>
        </View>

        <View style={stili.riga}>
          <Text style={stili.etichetta}>Ore frequentate</Text>
          <Text style={stili.valore}>{dati.oreFrequentate}</Text>
        </View>
        <View style={stili.riga}>
          <Text style={stili.etichetta}>Percentuale di presenza</Text>
          <Text style={stili.valore}>{dati.percentualePresenza}%</Text>
        </View>

        <Text style={stili.firma}>Il Presidente</Text>

        <Text style={{ position: "absolute", bottom: 24, left: 56, fontSize: 8, color: "#999999" }}>
          Documento generato il {dati.dataGenerazione}
        </Text>
      </Page>
    </Document>
  );
}
