"use server";
import "server-only";
import { revalidatePath } from "next/cache";
import { renderToBuffer } from "@react-pdf/renderer";
import { prisma } from "@/lib/prisma";
import { richiediRuolo } from "@/lib/auth/richiedi-utente";
import { registraAudit } from "@/lib/audit";
import { salvaAllegato } from "@/lib/storage";
import { sostituisciVariabili } from "@/lib/email/template";
import {
  schemaTemplateDocumento,
  schemaGenerazioneTemplate,
  type DatiTemplateDocumento,
  type DatiGenerazioneTemplate,
} from "@/lib/validazioni/template-documento";
import { DocumentoGeneratoPdf } from "./documento-generato-pdf";

const RUOLI_GESTIONE_TEMPLATE = ["amministratore", "segreteria"] as const;

export async function creaTemplateDocumento(
  datiGrezzi: DatiTemplateDocumento
): Promise<{ errore: string } | { ok: true; templateId: string }> {
  const utente = await richiediRuolo([...RUOLI_GESTIONE_TEMPLATE]);
  const risultato = schemaTemplateDocumento.safeParse(datiGrezzi);
  if (!risultato.success) return { errore: risultato.error.issues[0].message };
  const dati = risultato.data;

  const template = await prisma.templateDocumento.create({
    data: {
      nome: dati.nome,
      descrizione: dati.descrizione || null,
      corpoTesto: dati.corpoTesto,
      createdById: utente.id,
    },
  });

  await registraAudit({ utenteId: utente.id, entita: "TemplateDocumento", entitaId: template.id, azione: "create" });
  revalidatePath("/documenti");
  return { ok: true, templateId: template.id };
}

export async function modificaTemplateDocumento(
  templateId: string,
  datiGrezzi: DatiTemplateDocumento
): Promise<{ errore: string } | { ok: true }> {
  const utente = await richiediRuolo([...RUOLI_GESTIONE_TEMPLATE]);
  const risultato = schemaTemplateDocumento.safeParse(datiGrezzi);
  if (!risultato.success) return { errore: risultato.error.issues[0].message };
  const dati = risultato.data;

  const esistente = await prisma.templateDocumento.findUnique({ where: { id: templateId } });
  if (!esistente || esistente.deletedAt) return { errore: "Modello non trovato." };

  await prisma.templateDocumento.update({
    where: { id: templateId },
    data: { nome: dati.nome, descrizione: dati.descrizione || null, corpoTesto: dati.corpoTesto },
  });

  await registraAudit({ utenteId: utente.id, entita: "TemplateDocumento", entitaId: templateId, azione: "update" });
  revalidatePath("/documenti");
  return { ok: true };
}

export async function eliminaTemplateDocumento(templateId: string): Promise<{ errore: string } | { ok: true }> {
  const utente = await richiediRuolo([...RUOLI_GESTIONE_TEMPLATE]);
  const esistente = await prisma.templateDocumento.findUnique({ where: { id: templateId } });
  if (!esistente || esistente.deletedAt) return { errore: "Modello non trovato." };

  await prisma.templateDocumento.update({ where: { id: templateId }, data: { deletedAt: new Date() } });
  await registraAudit({ utenteId: utente.id, entita: "TemplateDocumento", entitaId: templateId, azione: "delete" });
  revalidatePath("/documenti");
  return { ok: true };
}

/**
 * Compila un modello con i valori forniti e genera il PDF risultante.
 * Se `salvaInArchivio` è vero, lo allega e crea anche una riga Documento
 * nell'archivio di M8 (stessa logica di `caricaDocumento`), altrimenti
 * restituisce solo il PDF da scaricare al volo, senza persisterlo.
 */
export async function generaDocumentoDaTemplate(
  templateId: string,
  datiGrezzi: DatiGenerazioneTemplate
): Promise<{ errore: string } | { ok: true; documentoId?: string }> {
  const utente = await richiediRuolo([...RUOLI_GESTIONE_TEMPLATE]);
  const risultato = schemaGenerazioneTemplate.safeParse(datiGrezzi);
  if (!risultato.success) return { errore: risultato.error.issues[0].message };
  const dati = risultato.data;

  const template = await prisma.templateDocumento.findUnique({ where: { id: templateId } });
  if (!template || template.deletedAt) return { errore: "Modello non trovato." };

  if (!dati.salvaInArchivio) {
    return { errore: "Per il solo download usare la rotta di generazione PDF, non questa azione." };
  }

  const associazione = await prisma.associazione.findFirst();
  const testoCompilato = sostituisciVariabili(template.corpoTesto, dati.valori);
  const buffer = await renderToBuffer(
    DocumentoGeneratoPdf({
      denominazioneEnte: associazione?.denominazione ?? "Associazione",
      titolo: dati.titoloDocumento || template.nome,
      corpoTesto: testoCompilato,
      dataGenerazione: new Intl.DateTimeFormat("it-IT", { dateStyle: "short", timeStyle: "short" }).format(new Date()),
    })
  );

  const documentoId = crypto.randomUUID();
  const allegato = await salvaAllegato({
    entitaTipo: "Documento",
    entitaId: documentoId,
    nomeFileOriginale: `${dati.titoloDocumento || template.nome}.pdf`,
    mimeType: "application/pdf",
    buffer,
    createdById: utente.id,
  });

  await prisma.documento.create({
    data: {
      id: documentoId,
      titolo: dati.titoloDocumento || template.nome,
      categoria: dati.categoria || "moduli",
      allegatoId: allegato.id,
      createdById: utente.id,
    },
  });

  await registraAudit({
    utenteId: utente.id,
    entita: "Documento",
    entitaId: documentoId,
    azione: "generato_da_template",
    diff: { templateId },
  });
  revalidatePath("/documenti");
  return { ok: true, documentoId };
}
