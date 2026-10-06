"use client";

import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Pencil, Trash2, FileText, Download } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { schemaTemplateDocumento, type DatiTemplateDocumento } from "@/lib/validazioni/template-documento";
import { CATEGORIE_DOCUMENTO, ETICHETTE_CATEGORIE_DOCUMENTO } from "@/lib/validazioni/protocollo";
import { creaTemplateDocumento, modificaTemplateDocumento, eliminaTemplateDocumento, generaDocumentoDaTemplate } from "@/lib/template-documento/actions";
import { estraiVariabili } from "@/lib/template-documento/variabili";

type TemplateRiga = {
  id: string;
  nome: string;
  descrizione: string | null;
  corpoTesto: string;
};

function classiCampo(): string {
  return "border-input flex h-11 w-full rounded-md border bg-transparent px-3 py-2 text-base shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] md:text-sm";
}

function DialogTemplate({ template }: { template?: TemplateRiga }) {
  const router = useRouter();
  const [aperto, setAperto] = useState(false);
  const {
    handleSubmit,
    register,
    formState: { errors, isSubmitting },
  } = useForm<DatiTemplateDocumento>({
    resolver: zodResolver(schemaTemplateDocumento),
    defaultValues: template
      ? { nome: template.nome, descrizione: template.descrizione ?? "", corpoTesto: template.corpoTesto }
      : { nome: "", descrizione: "", corpoTesto: "" },
  });

  async function onSubmit(dati: DatiTemplateDocumento) {
    const esito = template ? await modificaTemplateDocumento(template.id, dati) : await creaTemplateDocumento(dati);
    if ("errore" in esito) {
      toast.error(esito.errore);
      return;
    }
    toast.success(template ? "Modello aggiornato." : "Modello creato.");
    setAperto(false);
    router.refresh();
  }

  return (
    <Dialog open={aperto} onOpenChange={setAperto}>
      <DialogTrigger asChild>
        {template ? (
          <Button variant="ghost" size="icon">
            <Pencil />
          </Button>
        ) : (
          <Button size="sm">
            <Plus /> Nuovo modello
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{template ? "Modifica modello" : "Nuovo modello di documento"}</DialogTitle>
          <DialogDescription>
            Scrivi il testo del documento usando segnaposto come <code>{"{{nome}}"}</code> per le parti che
            cambieranno ogni volta: verranno proposte come campi da compilare quando generi un documento da questo
            modello.
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="space-y-2">
            <Label htmlFor="nome">Nome del modello</Label>
            <Input id="nome" {...register("nome")} />
            {errors.nome && <p className="text-sm text-destructive">{errors.nome.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="descrizione">Descrizione (facoltativa)</Label>
            <Input id="descrizione" {...register("descrizione")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="corpoTesto">Testo del documento</Label>
            <Textarea
              id="corpoTesto"
              rows={12}
              placeholder={"Gentile {{nome_destinatario}},\n\nla convochiamo per il giorno {{data}}..."}
              {...register("corpoTesto")}
            />
            {errors.corpoTesto && <p className="text-sm text-destructive">{errors.corpoTesto.message}</p>}
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="animate-spin" />}
              Salva
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DialogGeneraDocumento({ template }: { template: TemplateRiga }) {
  const router = useRouter();
  const [aperto, setAperto] = useState(false);
  const [inAttesa, setInAttesa] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const variabili = estraiVariabili(template.corpoTesto);

  async function onSalvaInArchivio() {
    if (!formRef.current) return;
    const formData = new FormData(formRef.current);
    const valori: Record<string, string> = {};
    for (const nome of variabili) valori[nome] = String(formData.get(nome) ?? "");

    setInAttesa(true);
    const esito = await generaDocumentoDaTemplate(template.id, {
      valori,
      salvaInArchivio: true,
      titoloDocumento: String(formData.get("titoloDocumento") ?? ""),
      categoria: String(formData.get("categoria") ?? ""),
    });
    setInAttesa(false);
    if ("errore" in esito) {
      toast.error(esito.errore);
      return;
    }
    toast.success("Documento generato e salvato nell'archivio.");
    setAperto(false);
    router.refresh();
  }

  return (
    <Dialog open={aperto} onOpenChange={setAperto}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <FileText /> Genera documento
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Genera documento da &quot;{template.nome}&quot;</DialogTitle>
        </DialogHeader>
        <form
          ref={formRef}
          action={`/documenti/template/${template.id}/genera-pdf`}
          method="post"
          target="_blank"
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="titoloDocumento">Titolo del documento</Label>
            <Input id="titoloDocumento" name="titoloDocumento" defaultValue={template.nome} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="categoria">Categoria (per il salvataggio in archivio)</Label>
            <select id="categoria" name="categoria" className={classiCampo()} defaultValue="moduli">
              {CATEGORIE_DOCUMENTO.map((c) => (
                <option key={c} value={c}>
                  {ETICHETTE_CATEGORIE_DOCUMENTO[c]}
                </option>
              ))}
            </select>
          </div>
          {variabili.length === 0 ? (
            <p className="text-sm text-muted-foreground">Questo modello non contiene parti variabili.</p>
          ) : (
            variabili.map((nome) => (
              <div key={nome} className="space-y-2">
                <Label htmlFor={`var-${nome}`}>{nome}</Label>
                <Textarea id={`var-${nome}`} name={nome} rows={2} />
              </div>
            ))
          )}
          <DialogFooter className="flex-col gap-2 sm:flex-row">
            <Button type="button" variant="outline" onClick={onSalvaInArchivio} disabled={inAttesa}>
              {inAttesa && <Loader2 className="animate-spin" />}
              Genera e salva in archivio
            </Button>
            <Button type="submit">
              <Download /> Genera e scarica PDF
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function TabTemplate({ template, puoGestire }: { template: TemplateRiga[]; puoGestire: boolean }) {
  const router = useRouter();

  async function onElimina(templateId: string) {
    const esito = await eliminaTemplateDocumento(templateId);
    if ("errore" in esito) {
      toast.error(esito.errore);
      return;
    }
    router.refresh();
  }

  return (
    <Card>
      <CardContent className="space-y-4 pt-6">
        {puoGestire && (
          <div className="flex justify-end">
            <DialogTemplate />
          </div>
        )}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Descrizione</TableHead>
              <TableHead>Variabili</TableHead>
              <TableHead className="text-right">Azioni</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {template.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">
                  Nessun modello di documento creato.
                </TableCell>
              </TableRow>
            )}
            {template.map((t) => {
              const variabili = estraiVariabili(t.corpoTesto);
              return (
                <TableRow key={t.id}>
                  <TableCell className="font-medium">{t.nome}</TableCell>
                  <TableCell className="max-w-xs truncate text-muted-foreground">{t.descrizione ?? "—"}</TableCell>
                  <TableCell>
                    {variabili.length === 0 ? (
                      <span className="text-muted-foreground">nessuna</span>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {variabili.map((v) => (
                          <Badge key={v} variant="outline" className="text-[10px]">
                            {v}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <DialogGeneraDocumento template={t} />
                      {puoGestire && (
                        <>
                          <DialogTemplate template={t} />
                          <Button variant="ghost" size="icon" onClick={() => onElimina(t.id)}>
                            <Trash2 className="text-destructive" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
