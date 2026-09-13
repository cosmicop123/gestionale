import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer";

const stili = StyleSheet.create({
  pagina: { padding: 40, fontSize: 10, fontFamily: "Helvetica", color: "#111111" },
  intestazione: { marginBottom: 16, borderBottom: 1, borderBottomColor: "#cccccc", paddingBottom: 8 },
  denominazione: { fontSize: 13, fontWeight: 700 },
  titolo: { fontSize: 14, fontWeight: 700, marginTop: 8 },
  sottotitolo: { fontSize: 9, color: "#555555", marginTop: 2 },
  intestazioneTabella: { flexDirection: "row", borderBottom: 1, borderBottomColor: "#111111", paddingBottom: 4, marginTop: 16 },
  riga: { flexDirection: "row", borderBottom: 0.5, borderBottomColor: "#dddddd", paddingVertical: 4 },
  colNome: { flex: 3 },
  colStato: { flex: 1 },
  colOra: { flex: 1 },
  colFirma: { flex: 2 },
  intestazioneCella: { fontWeight: 700, fontSize: 9 },
  piePagina: { position: "absolute", bottom: 24, left: 40, fontSize: 8, color: "#999999" },
});

export type RigaRegistroPresenze = {
  nomeCognome: string;
  stato: string | null;
  oraIngresso: string | null;
};

export type DatiRegistroPresenzePdf = {
  denominazioneEnte: string;
  corsoTitolo: string;
  numeroProgressivo: number;
  data: string;
  orario: string;
  righe: RigaRegistroPresenze[];
  dataGenerazione: string;
};

export function RegistroPresenzeDocument(dati: DatiRegistroPresenzePdf) {
  return (
    <Document>
      <Page size="A4" style={stili.pagina}>
        <View style={stili.intestazione}>
          <Text style={stili.denominazione}>{dati.denominazioneEnte}</Text>
          <Text style={stili.titolo}>Registro presenze — {dati.corsoTitolo}</Text>
          <Text style={stili.sottotitolo}>
            Lezione n. {dati.numeroProgressivo} del {dati.data}, ore {dati.orario}
          </Text>
        </View>

        <View style={stili.intestazioneTabella}>
          <Text style={[stili.colNome, stili.intestazioneCella]}>Cognome e nome</Text>
          <Text style={[stili.colStato, stili.intestazioneCella]}>Stato</Text>
          <Text style={[stili.colOra, stili.intestazioneCella]}>Ingresso</Text>
          <Text style={[stili.colFirma, stili.intestazioneCella]}>Firma</Text>
        </View>

        {dati.righe.map((riga, indice) => (
          <View key={indice} style={stili.riga}>
            <Text style={stili.colNome}>{riga.nomeCognome}</Text>
            <Text style={stili.colStato}>{riga.stato ?? "—"}</Text>
            <Text style={stili.colOra}>{riga.oraIngresso ?? "—"}</Text>
            <Text style={stili.colFirma}></Text>
          </View>
        ))}

        <Text style={stili.piePagina}>Documento generato il {dati.dataGenerazione}</Text>
      </Page>
    </Document>
  );
}
