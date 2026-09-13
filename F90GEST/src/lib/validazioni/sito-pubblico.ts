import { z } from "zod";

export const TEMPLATE_SITO_PUBBLICO = ["classico", "moderno", "vivace"] as const;
export type TemplateSitoPubblico = (typeof TEMPLATE_SITO_PUBBLICO)[number];

export const ETICHETTE_TEMPLATE_SITO_PUBBLICO: Record<TemplateSitoPubblico, string> = {
  classico: "Classico",
  moderno: "Moderno",
  vivace: "Vivace",
};

export const DESCRIZIONI_TEMPLATE_SITO_PUBBLICO: Record<TemplateSitoPubblico, string> = {
  classico: "Impostazione sobria e istituzionale, palette blu notte e crema, font con grazie.",
  moderno: "Impostazione essenziale e pulita, palette blu/bianco, corsi in schede a griglia.",
  vivace: "Impostazione calda e informale, palette terracotta/senape, arrotondata e colorata.",
};

export function templateSitoPubblicoValido(valore: string): valore is TemplateSitoPubblico {
  return (TEMPLATE_SITO_PUBBLICO as readonly string[]).includes(valore);
}

export const schemaConfigurazioneSitoPubblico = z.object({
  presentazione: z.string().optional().or(z.literal("")),
  urlBase: z
    .string()
    .trim()
    .refine((v) => v === "" || /^https?:\/\/.+/.test(v), {
      message: "Inserire un URL valido che inizi con http:// o https://, oppure lasciare vuoto.",
    })
    .optional()
    .or(z.literal("")),
});
export type DatiConfigurazioneSitoPubblico = z.infer<typeof schemaConfigurazioneSitoPubblico>;
