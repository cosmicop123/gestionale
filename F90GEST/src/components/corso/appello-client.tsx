"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Camera, QrCode, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { STATI_PRESENZA, ETICHETTE_STATI_PRESENZA } from "@/lib/validazioni/corso";
import { registraPresenza, registraPresenzaDaQr } from "@/lib/presenza/actions";

type RigaAppello = {
  iscrizioneId: string;
  nomeCognome: string;
  stato: string | null;
  qrDataUrl: string;
};

// L'API BarcodeDetector non è ancora nei tipi standard del DOM in tutte le
// versioni di TypeScript: dichiarazione minima solo per l'uso qui, con
// controllo di disponibilità a runtime prima di ogni utilizzo (§8, la
// scansione via camera è un'opzione aggiuntiva con fallback manuale sempre
// disponibile per i browser che non la supportano).
type RilevatoreCodiciABarre = {
  detect: (sorgente: CanvasImageSource) => Promise<{ rawValue: string }[]>;
};
type FinestraConBarcodeDetector = Window & {
  BarcodeDetector?: new (opzioni: { formats: string[] }) => RilevatoreCodiciABarre;
};

function ScannerQr({
  onRilevato,
  onChiudi,
}: {
  onRilevato: (valore: string) => void;
  onChiudi: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [supportato] = useState(() => typeof window !== "undefined" && "BarcodeDetector" in window);
  const [errore, setErrore] = useState<string | null>(null);

  useEffect(() => {
    if (!supportato) return;
    const finestra = window as FinestraConBarcodeDetector;

    let attivo = true;
    let stream: MediaStream | null = null;
    const rilevatore = new finestra.BarcodeDetector!({ formats: ["qr_code"] });

    async function avvia() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        if (!attivo || !videoRef.current) return;
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        scansiona();
      } catch {
        setErrore("Impossibile accedere alla fotocamera: usa l'appello manuale.");
      }
    }

    async function scansiona() {
      if (!attivo || !videoRef.current) return;
      try {
        const codici = await rilevatore.detect(videoRef.current);
        if (codici.length > 0) {
          onRilevato(codici[0].rawValue);
          return;
        }
      } catch {
        // fotogramma non valido: si riprova al successivo
      }
      if (attivo) requestAnimationFrame(scansiona);
    }

    avvia();
    return () => {
      attivo = false;
      stream?.getTracks().forEach((t) => t.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supportato]);

  return (
    <div className="space-y-3">
      {!supportato ? (
        <p className="text-sm text-destructive">
          La scansione QR non è supportata da questo browser: usa l&apos;appello manuale.
        </p>
      ) : errore ? (
        <p className="text-sm text-destructive">{errore}</p>
      ) : (
        <video ref={videoRef} className="w-full rounded-md bg-black" muted playsInline />
      )}
      <Button variant="outline" onClick={onChiudi} className="w-full">
        <X /> Chiudi
      </Button>
    </div>
  );
}

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
