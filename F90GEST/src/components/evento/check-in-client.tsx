"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Camera, QrCode, Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScannerQr } from "@/components/shared/qr-scanner";
import { registraCheckIn, registraCheckInQr } from "@/lib/partecipazione-evento/actions";

type RigaCheckIn = {
  partecipazioneId: string;
  nome: string;
  dataCheckIn: string | null;
  qrDataUrl: string;
};

export function CheckInClient({
  eventoId,
  righeIniziali,
}: {
  eventoId: string;
  righeIniziali: RigaCheckIn[];
}) {
  const [righe, setRighe] = useState(righeIniziali);
  const [scannerAperto, setScannerAperto] = useState(false);
  const [qrVisualizzato, setQrVisualizzato] = useState<RigaCheckIn | null>(null);

  function segnaCheckIn(partecipazioneId: string) {
    setRighe((prec) =>
      prec.map((r) => (r.partecipazioneId === partecipazioneId ? { ...r, dataCheckIn: new Date().toISOString() } : r))
    );
  }

  async function onCheckInManuale(partecipazioneId: string) {
    const esito = await registraCheckIn(eventoId, partecipazioneId);
    if ("errore" in esito) {
      toast.error(esito.errore);
      return;
    }
    segnaCheckIn(partecipazioneId);
  }

  async function onQrRilevato(valore: string) {
    const riga = righe.find((r) => r.partecipazioneId === valore);
    if (!riga) {
      toast.error("Codice non riconosciuto per questo evento.");
      return;
    }
    const esito = await registraCheckInQr(eventoId, valore);
    if ("errore" in esito) {
      toast.error(esito.errore);
      return;
    }
    segnaCheckIn(valore);
    toast.success(`Check-in: ${esito.nome}`);
  }

  return (
    <div className="space-y-4">
      <Button className="w-full" onClick={() => setScannerAperto(true)}>
        <Camera /> Scansiona QR per il check-in
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
          <p className="text-center text-sm text-muted-foreground">Nessun partecipante registrato.</p>
        )}
        {righe.map((riga) => (
          <Card key={riga.partecipazioneId}>
            <CardContent className="flex items-center justify-between gap-3 pt-4">
              <span className="font-medium">{riga.nome}</span>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={() => setQrVisualizzato(riga)}>
                  <QrCode />
                </Button>
                <Button
                  size="sm"
                  variant={riga.dataCheckIn ? "default" : "outline"}
                  disabled={!!riga.dataCheckIn}
                  onClick={() => onCheckInManuale(riga.partecipazioneId)}
                >
                  <Check /> {riga.dataCheckIn ? "Presente" : "Check-in"}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={qrVisualizzato !== null} onOpenChange={(aperto) => !aperto && setQrVisualizzato(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{qrVisualizzato?.nome}</DialogTitle>
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
