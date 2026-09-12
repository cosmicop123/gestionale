import "server-only";
import { prisma } from "@/lib/prisma";

/**
 * Registra una voce nel log di controllo (§5.7, append-only, mai
 * cancellabile). Non deve mai far fallire l'operazione principale: un
 * errore di audit non deve impedire un'operazione di business già valida,
 * quindi eventuali errori vengono solo loggati in console.
 */
export async function registraAudit(voce: {
  utenteId: string | null;
  entita: string;
  entitaId: string;
  azione: string;
  diff?: Record<string, unknown>;
  ip?: string | null;
}): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        utenteId: voce.utenteId,
        entita: voce.entita,
        entitaId: voce.entitaId,
        azione: voce.azione,
        diffJson: voce.diff ? JSON.stringify(voce.diff) : null,
        ip: voce.ip ?? null,
      },
    });
  } catch (errore) {
    console.error("Impossibile scrivere l'audit log:", errore);
  }
}
