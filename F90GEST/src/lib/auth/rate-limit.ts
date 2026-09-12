import "server-only";

// Rate limiting sul login (§8, requisito di sicurezza). Per un'applicazione
// mono-processo con 1-4 utenti non serve Redis (esplicitamente vietato dal
// vincolo tecnico §4): una mappa in memoria con finestra scorrevole basta,
// col limite noto che si azzera a un riavvio del processo — accettabile per
// questa scala.
const TENTATIVI_MASSIMI = 5;
const FINESTRA_MS = 1000 * 60 * 15; // 15 minuti

type Voce = { tentativi: number; primoTentativoMs: number };

const tentativiPerChiave = new Map<string, Voce>();

export function verificaELimitaTentativi(chiave: string): { consentito: boolean; riprovaTraSecondi?: number } {
  const ora = Date.now();
  const voce = tentativiPerChiave.get(chiave);

  if (!voce || ora - voce.primoTentativoMs > FINESTRA_MS) {
    tentativiPerChiave.set(chiave, { tentativi: 1, primoTentativoMs: ora });
    return { consentito: true };
  }

  if (voce.tentativi >= TENTATIVI_MASSIMI) {
    const riprovaTraSecondi = Math.ceil((FINESTRA_MS - (ora - voce.primoTentativoMs)) / 1000);
    return { consentito: false, riprovaTraSecondi };
  }

  voce.tentativi += 1;
  return { consentito: true };
}

export function azzeraTentativi(chiave: string): void {
  tentativiPerChiave.delete(chiave);
}
