"use server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { richiediRuolo } from "@/lib/auth/richiedi-utente";
import { registraAudit } from "@/lib/audit";
import { salvaAllegato } from "@/lib/storage";
import { schemaSalvaComunicazione, type DatiSalvaComunicazione } from "@/lib/validazioni/compilatore";
import { renderizzaComunicazionePdf } from "./render-pdf";

const RUOLI_COMPILATORE = ["amministratore", "segreteria"] as const;

/**
 * Compila il documento del Compilatore in PDF e lo salva nell'archivio
 * (`Documento`, M8) — stesso schema di `generaDocumentoDaTemplate` per i
 * modelli con segnaposto: qui non c'è un modello riutilizzabile a monte
 * (il testo è scritto/formattato una volta nell'editor), ma l'esito è lo
 * stesso tipo di riga in archivio. Il solo download (senza salvare) passa
 * invece dalla rotta `/compilatore/genera-pdf`, mai da questa azione.
 */
export async function salvaComunicazioneInArchivio(
  datiGrezzi: DatiSalvaComunicazione
): Promise<{ errore: string } | { ok: true; documentoId: string }> {
  const utente = await richiediRuolo([...RUOLI_COMPILATORE]);
  const risultato = schemaSalvaComunicazione.safeParse(datiGrezzi);
  if (!risultato.success) return { errore: risultato.error.issues[0].message };
  const dati = risultato.data;

  const buffer = await renderizzaComunicazionePdf(dati.titolo, dati.corpoHtml);

  const documentoId = crypto.randomUUID();
  const allegato = await salvaAllegato({
    entitaTipo: "Documento",
    entitaId: documentoId,
    nomeFileOriginale: `${dati.titolo}.pdf`,
    mimeType: "application/pdf",
    buffer,
    createdById: utente.id,
  });

  await prisma.documento.create({
    data: {
      id: documentoId,
      titolo: dati.titolo,
      categoria: dati.categoria,
      allegatoId: allegato.id,
      createdById: utente.id,
    },
  });

  await registraAudit({
    utenteId: utente.id,
    entita: "Documento",
    entitaId: documentoId,
    azione: "generato_da_compilatore",
  });
  revalidatePath("/documenti");
  return { ok: true, documentoId };
}
