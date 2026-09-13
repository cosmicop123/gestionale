import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import * as XLSX from "xlsx";
import { richiediUtente } from "@/lib/auth/richiedi-utente";
import { libroSociAllaData } from "@/lib/socio/libro-soci";
import { ETICHETTE_CATEGORIE_SOCIO } from "@/lib/validazioni/socio";

// Nota: qui SheetJS (xlsx) è usato solo in scrittura, su dati che
// provengono dal nostro database — le vulnerabilità note del pacchetto
// riguardano il PARSING di file caricati da terzi (vedi CLAUDE.md), non
// questo percorso.
export async function GET(request: NextRequest) {
  await richiediUtente();

  const { searchParams } = new URL(request.url);
  const dataParam = searchParams.get("data");
  const formato = searchParams.get("formato") === "xlsx" ? "xlsx" : "csv";
  const dataRiferimento = dataParam ? new Date(dataParam) : new Date();

  const righe = await libroSociAllaData(dataRiferimento);
  const righeEsportazione = righe.map((r) => ({
    "N. libro soci": r.numeroLibroSoci,
    Cognome: r.cognome,
    Nome: r.nome,
    Categoria: ETICHETTE_CATEGORIE_SOCIO[r.categoria as keyof typeof ETICHETTE_CATEGORIE_SOCIO] ?? r.categoria,
    "Socio dal": r.dataDecorrenza.toISOString().slice(0, 10),
    Stato: r.stato,
  }));

  const foglio = XLSX.utils.json_to_sheet(righeEsportazione);
  const nomeFile = `libro-soci_${dataRiferimento.toISOString().slice(0, 10)}.${formato}`;

  if (formato === "csv") {
    const csv = XLSX.utils.sheet_to_csv(foglio);
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${nomeFile}"`,
      },
    });
  }

  const cartella = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(cartella, foglio, "Libro soci");
  const buffer = XLSX.write(cartella, { type: "buffer", bookType: "xlsx" }) as Buffer;

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${nomeFile}"`,
    },
  });
}
