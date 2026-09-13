"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Camera, QrCode } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScannerQr } from "@/components/shared/qr-scanner";
import { STATI_PRESENZA, ETICHETTE_STATI_PRESENZA } from "@/lib/validazioni/corso";
import { registraPresenza, registraPresenzaDaQr } from "@/lib/presenza/actions";

type RigaAppello = {
  iscrizioneId: string;
  nomeCognome: string;
  stato: string | null;
  qrDataUrl: string;
};

export function AppelloClient({
  lezioneId,
  righeIniziali,
}: {
  lezioneId: string;
  righeIniziali: RigaAppello[];
}) {
  const [righe, setRighe] = useState(righeIniziali);
  const [scannerAperto, setScannerAperto] = useState(false);
  const [qrVisualizzato, setQrVisualizzato] = useState<RigaAppello | null>(null);
  const [salvataggioInCorso, setSalvataggioInCorso] = useState<string | null>(null);

  function aggiornaStatoLocale(iscrizioneId: string, stato: string) {
    setRighe((prec) => prec.map((r) => (r.iscrizioneId === iscrizioneId ? { ...r, stato } : r)));
  }

  async function onImpostaStato(iscrizioneId: string, stato: (typeof STATI_PRESENZA)[number]) {
    setSalvataggioInCorso(iscrizioneId);
    const esito = await registraPresenza(lezioneId, { iscrizioneId, stato, metodo: "appello_manuale" });
    setSalvataggioInCorso(null);
    if ("errore" in esito) {
      toast.error(esito.errore);
      return;
    }
    aggiornaStatoLocale(iscrizioneId, stato);
  }

  async function onQrRilevato(valore: string) {
    const riga = righe.find((r) => r.iscrizioneId === valore);
    if (!riga) {
      toast.error("Codice non riconosciuto per questa lezione.");
      return;
    }
    const esito = await registraPresenzaDaQr(lezioneId, valore);
    if ("errore" in esito) {
      toast.error(esito.errore);
      return;
    }
    aggiornaStatoLocale(valore, "presente");
    toast.success(`Presente: ${esito.nomeCognome}`);
  }

  return (
    <div className="space-y-4">
      <Button className="w-full" onClick={() => setScannerAperto(true)}>
        <Camera /> Scansiona QR per l&apos;appello rapido
      </Button>

      {scannerAperto && (
        <Card>
          <CardContent className="pt-6">
            <ScannerQr onRilevato={onQrRilevato} onChiudi={() => setScannerAperto(false)} />
          </CardContent>
        </Card>
      )}

      <div className="space-y-2">
        {righe.length === 0 && (
          <p className="text-center text-sm text-muted-foreground">Nessun iscritto confermato per questo corso.</p>
        )}
        {righe.map((riga) => (
          <Card key={riga.iscrizioneId}>
            <CardContent className="flex flex-col gap-3 pt-4">
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium">{riga.nomeCognome}</span>
                <Button variant="ghost" size="icon" onClick={() => setQrVisualizzato(riga)}>
                  <QrCode />
                </Button>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {STATI_PRESENZA.map((stato) => (
                  <Button
                    key={stato}
                    size="sm"
                    variant={riga.stato === stato ? "default" : "outline"}
                    disabled={salvataggioInCorso === riga.iscrizioneId}
                    onClick={() => onImpostaStato(riga.iscrizioneId, stato)}
                  >
                    {ETICHETTE_STATI_PRESENZA[stato]}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={qrVisualizzato !== null} onOpenChange={(aperto) => !aperto && setQrVisualizzato(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{qrVisualizzato?.nomeCognome}</DialogTitle>
          </DialogHeader>
          {qrVisualizzato && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={qrVisualizzato.qrDataUrl} alt="Codice QR personale" className="mx-auto" />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
