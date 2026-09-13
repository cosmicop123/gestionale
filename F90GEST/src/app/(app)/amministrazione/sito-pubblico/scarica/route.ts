import { NextResponse } from "next/server";
import { richiediRuolo } from "@/lib/auth/richiedi-utente";
import { registraAudit } from "@/lib/audit";
import { templateSitoPubblicoValido } from "@/lib/validazioni/sito-pubblico";
import { generaArchivioSitoPubblico } from "@/lib/sito-pubblico/genera";

export async function GET(request: Request) {
  const utente = await richiediRuolo(["amministratore"]);

  const template = new URL(request.url).searchParams.get("template") ?? "";
  if (!templateSitoPubblicoValido(template)) {
    return NextResponse.json({ errore: "Template non valido." }, { status: 400 });
  }

  const archivio = await generaArchivioSitoPubblico(template);
  await registraAudit({
    utenteId: utente.id,
    entita: "SitoPubblico",
    entitaId: template,
    azione: "download",
  });

  const nomeFile = `sito-pubblico-${template}-${new Date().toISOString().slice(0, 10)}.zip`;
  return new NextResponse(new Uint8Array(archivio), {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${nomeFile}"`,
    },
  });
}
