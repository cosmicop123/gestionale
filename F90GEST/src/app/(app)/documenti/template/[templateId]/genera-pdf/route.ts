import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { richiediRuolo } from "@/lib/auth/richiedi-utente";
import { prisma } from "@/lib/prisma";
import { registraAudit } from "@/lib/audit";
import { sostituisciVariabili } from "@/lib/email/template";
import { estraiVariabili } from "@/lib/template-documento/variabili";
import { DocumentoGeneratoPdf } from "@/lib/template-documento/documento-generato-pdf";

/**
 * Generazione "al volo" del PDF da un modello compilato, senza salvarlo
 * nell'archivio: un semplice <form method="post"> dalla UI, il browser
 * scarica direttamente la risposta — stesso principio del verbale PDF di
 * M8 (generato on-demand, mai persistito per il solo download).
 */
export async function POST(request: Request, { params }: { params: Promise<{ templateId: string }> }) {
  const utente = await richiediRuolo(["amministratore", "segreteria"]);
  const { templateId } = await params;

  const template = await prisma.templateDocumento.findUnique({ where: { id: templateId } });
  if (!template || template.deletedAt) {
    return NextResponse.json({ errore: "Modello non trovato." }, { status: 404 });
  }

  const formData = await request.formData();
  const titoloDocumento = String(formData.get("titoloDocumento") ?? "") || template.nome;

  const variabiliAttese = estraiVariabili(template.corpoTesto);
  const valori: Record<string, string> = {};
  for (const nome of variabiliAttese) {
    valori[nome] = String(formData.get(nome) ?? "");
  }

  const associazione = await prisma.associazione.findFirst();
  const testoCompilato = sostituisciVariabili(template.corpoTesto, valori);
  const buffer = await renderToBuffer(
    DocumentoGeneratoPdf({
      denominazioneEnte: associazione?.denominazione ?? "Associazione",
      titolo: titoloDocumento,
      corpoTesto: testoCompilato,
      dataGenerazione: new Intl.DateTimeFormat("it-IT", { dateStyle: "short", timeStyle: "short" }).format(new Date()),
    })
  );

  await registraAudit({
    utenteId: utente.id,
    entita: "TemplateDocumento",
    entitaId: templateId,
    azione: "generazione_pdf",
  });

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${titoloDocumento}.pdf"`,
    },
  });
}
