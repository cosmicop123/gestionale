import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer";

const stili = StyleSheet.create({
  pagina: { padding: 48, fontSize: 10, fontFamily: "Helvetica", color: "#111111" },
  intestazione: { marginBottom: 20, borderBottom: 1, borderBottomColor: "#cccccc", paddingBottom: 10 },
  denominazione: { fontSize: 13, fontWeight: 700 },
  titolo: { fontSize: 13, fontWeight: 700, marginTop: 10, textAlign: "center" },
  sottotitolo: { fontSize: 10, textAlign: "center", marginBottom: 16, color: "#555555" },
  sezioneTitolo: { fontSize: 10, fontWeight: 700, marginTop: 16, marginBottom: 4 },
  corpo: { fontSize: 10, lineHeight: 1.5, whiteSpace: "pre-wrap" },
  riga: { flexDirection: "row", marginBottom: 2 },
  colNome: { flex: 3 },
  colStato: { flex: 1 },
  delibera: { marginBottom: 8, paddingLeft: 8, borderLeft: 2, borderLeftColor: "#cccccc" },
  piePagina: { position: "absolute", bottom: 24, left: 48, fontSize: 8, color: "#999999" },
});

export type DatiVerbalePdf = {
  denominazioneEnte: string;
  tipoRiunioneEtichetta: string;
  numeroProgressivo: number;
  data: string;
  ora: string | null;
  sede: string | null;
  ordineDelGiorno: string;
  partecipanti: { nome: string; convocato: boolean; presente: boolean; delegatoDa: string | null }[];
  delibere: { oggetto: string; esito: string; voti: string | null }[];
  verbaleTesto: string | null;
  dataGenerazione: string;
};

export function VerbaleDocument(dati: DatiVerbalePdf) {
  return (
    <Document>
      <Page size="A4" style={stili.pagina}>
        <View style={stili.intestazione}>
          <Text style={stili.denominazione}>{dati.denominazioneEnte}</Text>
        </View>

        <Text style={stili.titolo}>
          Verbale {dati.tipoRiunioneEtichetta} n. {dati.numeroProgressivo}
        </Text>
        <Text style={stili.sottotitolo}>
          {dati.data}
          {dati.ora ? `, ore ${dati.ora}` : ""}
          {dati.sede ? ` — ${dati.sede}` : ""}
        </Text>

        <Text style={stili.sezioneTitolo}>Ordine del giorno</Text>
        <Text style={stili.corpo}>{dati.ordineDelGiorno}</Text>

        <Text style={stili.sezioneTitolo}>Partecipanti</Text>
        {dati.partecipanti.map((p, indice) => (
          <View key={indice} style={stili.riga}>
            <Text style={stili.colNome}>
              {p.nome}
              {p.delegatoDa ? ` (delega di ${p.delegatoDa})` : ""}
            </Text>
            <Text style={stili.colStato}>{p.presente ? "Presente" : p.convocato ? "Assente" : "—"}</Text>
          </View>
        ))}

        {dati.delibere.length > 0 && (
          <>
            <Text style={stili.sezioneTitolo}>Delibere</Text>
            {dati.delibere.map((d, indice) => (
              <View key={indice} style={stili.delibera}>
                <Text>{d.oggetto}</Text>
                <Text style={{ color: "#555555" }}>
                  Esito: {d.esito}
                  {d.voti ? ` (${d.voti})` : ""}
                </Text>
              </View>
            ))}
          </>
        )}

        <Text style={stili.sezioneTitolo}>Verbale</Text>
        <Text style={stili.corpo}>{dati.verbaleTesto ?? "—"}</Text>

        <Text style={stili.piePagina}>Documento generato il {dati.dataGenerazione}</Text>
      </Page>
    </Document>
  );
}
