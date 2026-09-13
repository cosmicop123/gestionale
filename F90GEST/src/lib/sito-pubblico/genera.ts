import "server-only";
import AdmZip from "adm-zip";
import type { TemplateSitoPubblico } from "@/lib/validazioni/sito-pubblico";
import { costruisciDatiSitoPubblico, type DatiSitoPubblico } from "./dati";
import { generaHtmlClassico } from "./templates/classico";
import { generaHtmlModerno } from "./templates/moderno";
import { generaHtmlVivace } from "./templates/vivace";

const GENERATORI: Record<TemplateSitoPubblico, (dati: DatiSitoPubblico) => string> = {
  classico: generaHtmlClassico,
  moderno: generaHtmlModerno,
  vivace: generaHtmlVivace,
};

export async function generaAnteprimaSitoPubblico(template: TemplateSitoPubblico): Promise<string> {
  const dati = await costruisciDatiSitoPubblico();
  return GENERATORI[template](dati);
}

export async function generaArchivioSitoPubblico(template: TemplateSitoPubblico): Promise<Buffer> {
  const html = await generaAnteprimaSitoPubblico(template);
  const zip = new AdmZip();
  zip.addFile("index.html", Buffer.from(html, "utf-8"));
  return zip.toBuffer();
}
