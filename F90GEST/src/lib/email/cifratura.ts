import "server-only";
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

/**
 * Cifratura delle password delle caselle email/PEC configurate da
 * interfaccia (a differenza delle credenziali SMTP-solo-invio di M9, mai
 * salvate su disco perché lette da process.env): AES-256-GCM con chiave
 * derivata da EMAIL_CIFRATURA_SECRET (SHA-256 del segreto, per ottenere
 * sempre 32 byte indipendentemente da come il segreto è stato generato).
 * Fallisce esplicitamente se il segreto non è configurato, invece di
 * salvare la password in chiaro: una casella email non configurabile è
 * preferibile a una con credenziali esposte in un dump del database.
 */

function chiave(): Buffer {
  const segreto = process.env.EMAIL_CIFRATURA_SECRET;
  if (!segreto) {
    throw new Error(
      "EMAIL_CIFRATURA_SECRET non configurato: impostare questa variabile d'ambiente prima di salvare una casella email."
    );
  }
  return createHash("sha256").update(segreto).digest();
}

export function cifraSegreto(testoInChiaro: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", chiave(), iv);
  const cifrato = Buffer.concat([cipher.update(testoInChiaro, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, cifrato]).toString("base64");
}

export function decifraSegreto(valoreCifrato: string): string {
  const dati = Buffer.from(valoreCifrato, "base64");
  const iv = dati.subarray(0, 12);
  const tag = dati.subarray(12, 28);
  const cifrato = dati.subarray(28);
  const decipher = createDecipheriv("aes-256-gcm", chiave(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(cifrato), decipher.final()]).toString("utf8");
}
