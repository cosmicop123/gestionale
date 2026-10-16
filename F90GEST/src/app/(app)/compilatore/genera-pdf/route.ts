import { NextResponse } from "next/server";
import { richiediRuolo } from "@/lib/auth/richiedi-utente";
import { registraAudit } from "@/lib/audit";
import { renderizzaComunicazionePdf } from "@/lib/compilatore/render-pdf";

/**
 * Generazione "al volo" del PDF dal Compilatore, senza salvarlo
 * nell'archivio: stesso principio già usato per il verbale di riunione
 * (M8) e per i modelli di documento — un `<form method="post">` dalla UI,
 * il browser scarica direttamente la risposta.
 */
export async function POST(request: Request) {
  const utente = await richiediRuolo(["amministratore", "segreteria"]);

  const formData = await request.formData();
  const titolo = String(formData.get("titolo") ?? "").trim() || "Comunicazione";
  const corpoHtml = String(formData.get("corpoHtml") ?? "");

  if (!corpoHtml.trim()) {
    return NextResponse.json({ errore: "Il documento è vuoto." }, { status: 400 });
  }

  const buffer = await renderizzaComunicazionePdf(titolo, corpoHtml);

  await registraAudit({ utenteId: utente.id, entita: "Compilatore", entitaId: "esportazione", azione: "generazione_pdf" });

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${titolo}.pdf"`,
    },
  });
}
