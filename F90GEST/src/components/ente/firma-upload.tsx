"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Upload } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { caricaFirmaPresidente } from "@/lib/ente/actions";

export function FirmaUpload({ firmaAllegatoId }: { firmaAllegatoId: string | null }) {
  const router = useRouter();
  const [inAttesa, setInAttesa] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.set("file", file);
    setInAttesa(true);
    const esito = await caricaFirmaPresidente(formData);
    setInAttesa(false);
    if ("errore" in esito) {
      toast.error(esito.errore);
      return;
    }
    toast.success("Firma aggiornata.");
    if (inputRef.current) inputRef.current.value = "";
    router.refresh();
  }

  return (
    <div className="flex items-center gap-4">
      {firmaAllegatoId ? (
        // eslint-disable-next-line @next/next/no-img-element -- immagine servita dalla rotta generica allegati, non un asset statico ottimizzabile da next/image
        <img
          src={`/contabilita/allegati/${firmaAllegatoId}`}
          alt="Firma del Presidente"
          className="h-16 w-32 rounded-md border object-contain bg-white p-1"
        />
      ) : (
        <div className="flex h-16 w-32 items-center justify-center rounded-md border text-xs text-muted-foreground">
          Nessuna firma
        </div>
      )}
      <div className="space-y-1">
        <Label htmlFor="firma-file" className="sr-only">
          Carica firma
        </Label>
        <Button type="button" variant="outline" size="sm" disabled={inAttesa} asChild>
          <label htmlFor="firma-file" className="cursor-pointer">
            {inAttesa ? <Loader2 className="animate-spin" /> : <Upload />}
            {firmaAllegatoId ? "Sostituisci firma" : "Carica firma"}
          </label>
        </Button>
        <input
          ref={inputRef}
          id="firma-file"
          type="file"
          accept="image/png,image/jpeg,image/webp,image/svg+xml"
          className="hidden"
          disabled={inAttesa}
          onChange={onChange}
        />
        <p className="text-xs text-muted-foreground">
          PNG, JPG, WEBP o SVG (idealmente con sfondo trasparente). Stampata in calce alle ricevute.
        </p>
      </div>
    </div>
  );
}
