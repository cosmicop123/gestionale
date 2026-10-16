import { Document, Page, View, Text, Image, StyleSheet } from "@react-pdf/renderer";
import type { ReactElement } from "react";

const stili = StyleSheet.create({
  pagina: { padding: 48, fontSize: 10, fontFamily: "Helvetica", color: "#111111" },
  intestazione: {
    marginBottom: 20,
    borderBottom: 1,
    borderBottomColor: "#cccccc",
    paddingBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  logo: { width: 48, height: 48, objectFit: "contain" },
  denominazione: { fontSize: 13, fontWeight: 700 },
  titolo: { fontSize: 14, fontWeight: 700, marginTop: 4, marginBottom: 16, textAlign: "center" },
  piePagina: { position: "absolute", bottom: 24, left: 48, fontSize: 8, color: "#999999" },
});

export type DatiComunicazionePdf = {
  denominazioneEnte: string;
  logoDataUri: string | null;
  titolo: string;
  nodiCorpo: ReactElement[];
  dataGenerazione: string;
};

/**
 * Documento generico per il Compilatore (§ nota fuori milestone): stesso
 * principio di intestazione con logo già usato per le ricevute, ma corpo
 * reso da `costruisciNodiPdf` (HTML dell'editor -> primitivi react-pdf)
 * invece di un singolo blocco di testo semplice.
 */
export function ComunicazionePdf(dati: DatiComunicazionePdf) {
  return (
    <Document>
      <Page size="A4" style={stili.pagina}>
        <View style={stili.intestazione}>
          {dati.logoDataUri && (
            // eslint-disable-next-line jsx-a11y/alt-text -- <Image> di @react-pdf/renderer, non HTML: non accetta `alt`.
            <Image src={dati.logoDataUri} style={stili.logo} />
          )}
          <Text style={stili.denominazione}>{dati.denominazioneEnte}</Text>
        </View>

        <Text style={stili.titolo}>{dati.titolo}</Text>
        {dati.nodiCorpo}

        <Text style={stili.piePagina}>Documento generato il {dati.dataGenerazione}</Text>
      </Page>
    </Document>
  );
}
