"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Upload } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { caricaLogo } from "@/lib/ente/actions";

export function LogoUpload({ logoAllegatoId }: { logoAllegatoId: string | null }) {
  const router = useRouter();
  const [inAttesa, setInAttesa] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.set("file", file);
    setInAttesa(true);
    const esito = await caricaLogo(formData);
    setInAttesa(false);
    if ("errore" in esito) {
      toast.error(esito.errore);
      return;
    }
    toast.success("Logo aggiornato.");
    if (inputRef.current) inputRef.current.value = "";
    router.refresh();
  }

  return (
    <div className="flex items-center gap-4">
      {logoAllegatoId ? (
        // eslint-disable-next-line @next/next/no-img-element -- immagine servita dalla rotta generica allegati, non un asset statico ottimizzabile da next/image
        <img
          src={`/contabilita/allegati/${logoAllegatoId}`}
          alt="Logo dell'associazione"
          className="size-16 rounded-md border object-contain bg-white p-1"
        />
      ) : (
        <div className="flex size-16 items-center justify-center rounded-md border text-xs text-muted-foreground">
          Nessun logo
        </div>
      )}
      <div className="space-y-1">
        <Label htmlFor="logo-file" className="sr-only">
          Carica logo
        </Label>
        <Button type="button" variant="outline" size="sm" disabled={inAttesa} asChild>
          <label htmlFor="logo-file" className="cursor-pointer">
            {inAttesa ? <Loader2 className="animate-spin" /> : <Upload />}
            {logoAllegatoId ? "Sostituisci logo" : "Carica logo"}
          </label>
        </Button>
        <input
          ref={inputRef}
          id="logo-file"
          type="file"
          accept="image/png,image/jpeg,image/webp,image/svg+xml"
          className="hidden"
          disabled={inAttesa}
          onChange={onChange}
        />
        <p className="text-xs text-muted-foreground">PNG, JPG, WEBP o SVG. Usato in barra laterale, pagina di accesso e sito pubblico.</p>
      </div>
    </div>
  );
}
