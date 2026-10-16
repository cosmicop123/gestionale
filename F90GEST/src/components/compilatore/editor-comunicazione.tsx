"use client";

import { useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Heading3,
  Pilcrow,
  Eraser,
  Download,
  Loader2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { CATEGORIE_DOCUMENTO, ETICHETTE_CATEGORIE_DOCUMENTO } from "@/lib/validazioni/protocollo";
import { schemaSalvaComunicazione, type DatiSalvaComunicazione } from "@/lib/validazioni/compilatore";

function classiCampo(): string {
  return "border-input flex h-11 w-full rounded-md border bg-transparent px-3 py-2 text-base shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] md:text-sm";
}

type PulsanteFormattazione = { icona: typeof Bold; titolo: string; comando: string; valore?: string };

const PULSANTI_FORMATTAZIONE: PulsanteFormattazione[] = [
  { icona: Bold, titolo: "Grassetto", comando: "bold" },
  { icona: Italic, titolo: "Corsivo", comando: "italic" },
  { icona: Underline, titolo: "Sottolineato", comando: "underline" },
  { icona: Heading1, titolo: "Titolo 1", comando: "formatBlock", valore: "H1" },
  { icona: Heading2, titolo: "Titolo 2", comando: "formatBlock", valore: "H2" },
  { icona: Heading3, titolo: "Titolo 3", comando: "formatBlock", valore: "H3" },
  { icona: Pilcrow, titolo: "Paragrafo normale", comando: "formatBlock", valore: "P" },
  { icona: List, titolo: "Elenco puntato", comando: "insertUnorderedList" },
  { icona: ListOrdered, titolo: "Elenco numerato", comando: "insertOrderedList" },
  { icona: Eraser, titolo: "Rimuovi formattazione", comando: "removeFormat" },
];

/**
 * Editor HTML per il Compilatore (§ nota fuori milestone): un
 * `contentEditable` con una barra di formattazione che usa
 * `document.execCommand` (API nativa del browser, nessuna nuova
 * dipendenza npm per l'editing — solo `node-html-parser`, lato server,
 * per leggere l'HTML prodotto prima di convertirlo in PDF). Lo stesso
 * componente serve sia la sezione "Compilatore" (contenuto vuoto) sia il
 * verbale di ammissione neo-soci in Soci (contenuto precompilato): è
 * l'editor a non sapere da dove viene il contenuto iniziale, solo a
 * riceverlo come prop.
 */
export function EditorComunicazione({
  contenutoIniziale = "",
  titoloIniziale = "",
  categoriaIniziale = "moduli",
  rotaEsportaPdf,
  salvaInArchivio,
  redirectDopoSalvataggio,
}: {
  contenutoIniziale?: string;
  titoloIniziale?: string;
  categoriaIniziale?: string;
  rotaEsportaPdf: string;
  salvaInArchivio: (dati: DatiSalvaComunicazione) => Promise<{ errore: string } | { ok: true; documentoId: string }>;
  redirectDopoSalvataggio?: string;
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const editabileRef = useRef<HTMLDivElement>(null);
  const campoHtmlRef = useRef<HTMLInputElement>(null);
  const [salvataggioInCorso, setSalvataggioInCorso] = useState(false);

  useEffect(() => {
    if (editabileRef.current) editabileRef.current.innerHTML = contenutoIniziale;
    // Solo al montaggio: contentEditable è "non controllato" dopo, come ogni editor del genere —
    // riscrivere innerHTML ad ogni render sposterebbe il cursore dell'utente a ogni tasto premuto.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function eseguiComando(comando: string, valore?: string) {
    editabileRef.current?.focus();
    document.execCommand(comando, false, valore);
  }

  function sincronizzaCampoHtml() {
    if (campoHtmlRef.current && editabileRef.current) {
      campoHtmlRef.current.value = editabileRef.current.innerHTML;
    }
  }

  async function onSalvaInArchivio() {
    if (!formRef.current) return;
    sincronizzaCampoHtml();
    const formData = new FormData(formRef.current);
    const risultato = schemaSalvaComunicazione.safeParse({
      titolo: String(formData.get("titolo") ?? ""),
      corpoHtml: String(formData.get("corpoHtml") ?? ""),
      categoria: String(formData.get("categoria") ?? ""),
    });
    if (!risultato.success) {
      toast.error(risultato.error.issues[0].message);
      return;
    }
    setSalvataggioInCorso(true);
    const esito = await salvaInArchivio(risultato.data);
    setSalvataggioInCorso(false);
    if ("errore" in esito) {
      toast.error(esito.errore);
      return;
    }
    toast.success("Documento salvato nell'archivio.");
    if (redirectDopoSalvataggio) router.push(redirectDopoSalvataggio);
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form ref={formRef} action={rotaEsportaPdf} method="post" target="_blank" onSubmit={sincronizzaCampoHtml} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="titoloComunicazione">Titolo del documento</Label>
            <Input id="titoloComunicazione" name="titolo" defaultValue={titoloIniziale} placeholder="es. Comunicazione ai soci" />
          </div>

          <div className="space-y-2">
            <Label>Testo</Label>
            <div className="flex flex-wrap gap-1 rounded-md border bg-muted/30 p-1">
              {PULSANTI_FORMATTAZIONE.map(({ icona: Icona, titolo, comando, valore }) => (
                <Button
                  key={titolo}
                  type="button"
                  variant="ghost"
                  size="icon"
                  title={titolo}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => eseguiComando(comando, valore)}
                >
                  <Icona className="size-4" />
                </Button>
              ))}
            </div>
            <div
              ref={editabileRef}
              contentEditable
              suppressContentEditableWarning
              className="min-h-64 w-full rounded-md border bg-transparent px-3 py-2 text-sm leading-relaxed focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] focus-visible:outline-none [&_h1]:text-lg [&_h1]:font-bold [&_h2]:text-base [&_h2]:font-bold [&_h3]:text-sm [&_h3]:font-bold [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mb-2"
            />
            <input ref={campoHtmlRef} type="hidden" name="corpoHtml" />
          </div>

          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="space-y-2">
              <Label htmlFor="categoriaComunicazione">Categoria (per il salvataggio in archivio)</Label>
              <select id="categoriaComunicazione" name="categoria" className={classiCampo()} defaultValue={categoriaIniziale}>
                {CATEGORIE_DOCUMENTO.map((c) => (
                  <option key={c} value={c}>
                    {ETICHETTE_CATEGORIE_DOCUMENTO[c]}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={onSalvaInArchivio} disabled={salvataggioInCorso}>
                {salvataggioInCorso && <Loader2 className="animate-spin" />}
                Salva in archivio
              </Button>
              <Button type="submit">
                <Download /> Esporta PDF
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
