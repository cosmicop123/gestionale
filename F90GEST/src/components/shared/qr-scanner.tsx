"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

// L'API BarcodeDetector non è ancora nei tipi standard del DOM in tutte le
// versioni di TypeScript: dichiarazione minima solo per l'uso qui, con
// controllo di disponibilità a runtime prima di ogni utilizzo (§8, la
// scansione via camera è un'opzione aggiuntiva con fallback manuale sempre
// disponibile per i browser che non la supportano). Componente condiviso
// tra l'appello dei corsi (M4) e il check-in degli eventi (M7): stesso
// meccanismo, stesso limite dichiarato.
type RilevatoreCodiciABarre = {
  detect: (sorgente: CanvasImageSource) => Promise<{ rawValue: string }[]>;
};
type FinestraConBarcodeDetector = Window & {
  BarcodeDetector?: new (opzioni: { formats: string[] }) => RilevatoreCodiciABarre;
};

export function ScannerQr({
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
        setErrore("Impossibile accedere alla fotocamera: usa la modalità manuale.");
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
          La scansione QR non è supportata da questo browser: usa la modalità manuale.
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
