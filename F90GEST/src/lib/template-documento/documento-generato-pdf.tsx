import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer";

const stili = StyleSheet.create({
  pagina: { padding: 48, fontSize: 10, fontFamily: "Helvetica", color: "#111111" },
  intestazione: { marginBottom: 20, borderBottom: 1, borderBottomColor: "#cccccc", paddingBottom: 10 },
  denominazione: { fontSize: 13, fontWeight: 700 },
  titolo: { fontSize: 13, fontWeight: 700, marginTop: 16, marginBottom: 16, textAlign: "center" },
  corpo: { fontSize: 10, lineHeight: 1.5, whiteSpace: "pre-wrap" },
  piePagina: { position: "absolute", bottom: 24, left: 48, fontSize: 8, color: "#999999" },
});

export type DatiDocumentoGeneratoPdf = {
  denominazioneEnte: string;
  titolo: string;
  corpoTesto: string;
  dataGenerazione: string;
};

export function DocumentoGeneratoPdf(dati: DatiDocumentoGeneratoPdf) {
  return (
    <Document>
      <Page size="A4" style={stili.pagina}>
        <View style={stili.intestazione}>
          <Text style={stili.denominazione}>{dati.denominazioneEnte}</Text>
        </View>
        <Text style={stili.titolo}>{dati.titolo}</Text>
        <Text style={stili.corpo}>{dati.corpoTesto}</Text>
        <Text style={stili.piePagina}>Documento generato il {dati.dataGenerazione}</Text>
      </Page>
    </Document>
  );
}
