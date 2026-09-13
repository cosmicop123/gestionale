import { NextResponse } from "next/server";
import { richiediRuolo } from "@/lib/auth/richiedi-utente";
import { registraAudit } from "@/lib/audit";
import { creaArchivioBackup } from "@/lib/backup/archivio";

export async function GET() {
  const utente = await richiediRuolo(["amministratore"]);

  const archivio = await creaArchivioBackup();
  await registraAudit({ utenteId: utente.id, entita: "Backup", entitaId: "download", azione: "backup" });

  const nomeFile = `f90gest-backup-${new Date().toISOString().slice(0, 10)}.zip`;
  return new NextResponse(new Uint8Array(archivio), {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${nomeFile}"`,
    },
  });
}
