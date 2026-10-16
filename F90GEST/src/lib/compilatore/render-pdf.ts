import "server-only";
import { renderToBuffer } from "@react-pdf/renderer";
import { prisma } from "@/lib/prisma";
import { datiUriAllegato } from "@/lib/storage";
import { costruisciNodiPdf } from "./html-to-pdf-nodi";
import { ComunicazionePdf } from "./comunicazione-pdf";

/**
 * Logica di rendering condivisa tra la rotta di sola esportazione
 * (`/compilatore/genera-pdf`, scaricata al volo) e l'azione "Salva in
 * archivio" (`salvaComunicazioneInArchivio`): un solo punto che legge
 * l'ente e il logo, compila l'HTML in nodi react-pdf e produce il buffer,
 * evitando di duplicare la stessa sequenza in due file diversi.
 */
export async function renderizzaComunicazionePdf(titolo: string, corpoHtml: string): Promise<Buffer> {
  const associazione = await prisma.associazione.findFirst();
  const logoDataUri = await datiUriAllegato(associazione?.logoAllegatoId);

  const nodiCorpo = costruisciNodiPdf(corpoHtml);

  return renderToBuffer(
    ComunicazionePdf({
      denominazioneEnte: associazione?.denominazione ?? "Associazione",
      logoDataUri,
      titolo,
      nodiCorpo,
      dataGenerazione: new Intl.DateTimeFormat("it-IT", { dateStyle: "short", timeStyle: "short" }).format(new Date()),
    })
  );
}
