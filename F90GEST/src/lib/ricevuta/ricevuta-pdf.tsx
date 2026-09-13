import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer";

const stili = StyleSheet.create({
  pagina: { padding: 48, fontSize: 11, fontFamily: "Helvetica", color: "#111111" },
  intestazione: { marginBottom: 24, borderBottom: 1, borderBottomColor: "#cccccc", paddingBottom: 12 },
  denominazione: { fontSize: 14, fontWeight: 700 },
  datiEnte: { fontSize: 9, color: "#555555", marginTop: 2 },
  titolo: { fontSize: 16, fontWeight: 700, marginBottom: 4, textAlign: "center" },
  numero: { fontSize: 11, textAlign: "center", marginBottom: 24, color: "#555555" },
  riga: { flexDirection: "row", marginBottom: 8 },
  etichetta: { width: 140, color: "#555555" },
  valore: { flex: 1, fontWeight: 700 },
  bollo: { marginTop: 16, fontSize: 9, fontStyle: "italic" },
  piePagina: { marginTop: 48, fontSize: 8, color: "#777777" },
  firma: { marginTop: 48, textAlign: "right" },
  annullata: {
    position: "absolute",
    top: 260,
    left: 100,
    fontSize: 48,
    color: "#cc0000",
    opacity: 0.3,
    transform: "rotate(-25deg)",
  },
});

export type DatiRicevutaPdf = {
  denominazioneEnte: string;
  codiceFiscaleEnte: string;
  sedeEnte: string;
  numero: number;
  annoSolare: number;
  data: string;
  intestatarioNome: string;
  intestatarioCodiceFiscale: string | null;
  causale: string;
  importo: string;
  bolloApplicato: boolean;
  importoBollo: string | null;
  testoNormativoPiede: string | null;
  stato: string;
  dataGenerazione: string;
};

export function RicevutaDocument(dati: DatiRicevutaPdf) {
  return (
    <Document>
      <Page size="A4" style={stili.pagina}>
        {dati.stato === "annullata" && <Text style={stili.annullata}>ANNULLATA</Text>}
        <View style={stili.intestazione}>
          <Text style={stili.denominazione}>{dati.denominazioneEnte}</Text>
          <Text style={stili.datiEnte}>
            {dati.sedeEnte} — C.F. {dati.codiceFiscaleEnte}
          </Text>
        </View>

        <Text style={stili.titolo}>Ricevuta</Text>
        <Text style={stili.numero}>
          n. {dati.numero}/{dati.annoSolare} del {dati.data}
        </Text>

        <View style={stili.riga}>
          <Text style={stili.etichetta}>Ricevuto da</Text>
          <Text style={stili.valore}>{dati.intestatarioNome}</Text>
        </View>
        {dati.intestatarioCodiceFiscale && (
          <View style={stili.riga}>
            <Text style={stili.etichetta}>Codice fiscale</Text>
            <Text style={stili.valore}>{dati.intestatarioCodiceFiscale}</Text>
          </View>
        )}
        <View style={stili.riga}>
          <Text style={stili.etichetta}>Causale</Text>
          <Text style={stili.valore}>{dati.causale}</Text>
        </View>
        <View style={stili.riga}>
          <Text style={stili.etichetta}>Importo</Text>
          <Text style={stili.valore}>€ {dati.importo}</Text>
        </View>

        {dati.bolloApplicato && (
          <Text style={stili.bollo}>
            Imposta di bollo assolta in modo virtuale, € {dati.importoBollo} (art. 13 tariffa,
            parte I, DPR 642/1972 e successive modifiche).
          </Text>
        )}

        {dati.testoNormativoPiede && <Text style={stili.piePagina}>{dati.testoNormativoPiede}</Text>}

        <Text style={stili.firma}>Il Presidente / Il Tesoriere</Text>

        <Text style={{ position: "absolute", bottom: 24, left: 48, fontSize: 8, color: "#999999" }}>
          Documento generato il {dati.dataGenerazione}
        </Text>
      </Page>
    </Document>
  );
}
