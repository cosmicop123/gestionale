"use client";

import { useRef, useState } from "react";
import { Loader2, Download, Upload, TriangleAlert } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ripristinaBackup } from "@/lib/backup/actions";

export function TabBackup() {
  const [inCorso, setInCorso] = useState(false);
  const [messaggioEsito, setMessaggioEsito] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setInCorso(true);
    setMessaggioEsito(null);
    const formData = new FormData(e.currentTarget);
    const esito = await ripristinaBackup(formData);
    setInCorso(false);
    if ("errore" in esito) {
      toast.error(esito.errore);
      return;
    }
    setMessaggioEsito(esito.messaggio);
    formRef.current?.reset();
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Backup</CardTitle>
          <CardDescription>
            Scarica un unico archivio ZIP con il database e tutti gli allegati (ricevute, documenti, foto dei
            giustificativi, ecc.): è l&apos;unico file da conservare per un ripristino completo.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <a href="/amministrazione/backup/scarica">
              <Download /> Scarica backup
            </a>
          </Button>
        </CardContent>
      </Card>

      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <TriangleAlert className="text-destructive size-5" /> Ripristino
          </CardTitle>
          <CardDescription>
            Sostituisce database e allegati attuali con quelli contenuti nel file caricato. Operazione
            irreversibile (viene comunque salvata una copia di sicurezza dello stato attuale prima di procedere).
            Dopo il ripristino è necessario <strong>riavviare l&apos;applicazione</strong>.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form ref={formRef} className="space-y-4" onSubmit={onSubmit} encType="multipart/form-data">
            <div className="space-y-2">
              <Label htmlFor="file">File di backup (.zip)</Label>
              <input id="file" name="file" type="file" accept=".zip" className="text-sm" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="conferma">
                Digita <code>RIPRISTINA</code> per confermare
              </Label>
              <Input id="conferma" name="conferma" autoComplete="off" />
            </div>
            <Button type="submit" variant="destructive" disabled={inCorso}>
              {inCorso ? <Loader2 className="animate-spin" /> : <Upload />}
              Ripristina
            </Button>
          </form>
          {messaggioEsito && (
            <p className="mt-4 rounded-md border border-amber-500/50 bg-amber-500/10 p-3 text-sm">{messaggioEsito}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
