import { Document, Page, View, Text, Image, StyleSheet } from "@react-pdf/renderer";

// Formato tesserino (ID-1, come una carta di credito: 85,6 x 54 mm) per la
// stampa fisica, oltre alla versione digitale con QR (§6 M2).
const MM_IN_PT = 2.83465;
const LARGHEZZA = 85.6 * MM_IN_PT;
const ALTEZZA = 54 * MM_IN_PT;

const stili = StyleSheet.create({
  pagina: {
    width: LARGHEZZA,
    height: ALTEZZA,
    padding: 10,
    fontSize: 8,
    fontFamily: "Helvetica",
    flexDirection: "row",
  },
  colonnaTesto: {
    flex: 1,
    justifyContent: "space-between",
  },
  denominazione: {
    fontSize: 7,
    fontWeight: 700,
    marginBottom: 4,
  },
  titolo: {
    fontSize: 6,
    color: "#666666",
  },
  nome: {
    fontSize: 11,
    fontWeight: 700,
    marginTop: 2,
  },
  riga: {
    fontSize: 7,
    marginTop: 2,
  },
  qr: {
    width: 60,
    height: 60,
    marginLeft: 8,
  },
});

export type DatiTesseraPdf = {
  denominazioneEnte: string;
  nomeCognome: string;
  numeroTessera: string;
  numeroLibroSoci: number;
  categoria: string;
  annoSociale: string;
  qrDataUrl: string;
};

export function TesseraDocument(dati: DatiTesseraPdf) {
  return (
    <Document>
      <Page size={[LARGHEZZA, ALTEZZA]} style={stili.pagina}>
        <View style={stili.colonnaTesto}>
          <View>
            <Text style={stili.denominazione}>{dati.denominazioneEnte}</Text>
            <Text style={stili.titolo}>Tessera associativa {dati.annoSociale}</Text>
            <Text style={stili.nome}>{dati.nomeCognome}</Text>
          </View>
          <View>
            <Text style={stili.riga}>N. tessera: {dati.numeroTessera}</Text>
            <Text style={stili.riga}>N. libro soci: {dati.numeroLibroSoci}</Text>
            <Text style={stili.riga}>Categoria: {dati.categoria}</Text>
          </View>
        </View>
        {/* eslint-disable-next-line jsx-a11y/alt-text -- @react-pdf/renderer Image non supporta alt */}
        <Image src={dati.qrDataUrl} style={stili.qr} />
      </Page>
    </Document>
  );
}
