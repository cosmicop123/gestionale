import { execSync } from "node:child_process";
import { rmSync } from "node:fs";
import path from "node:path";

// Prepara un database SQLite dedicato ai test end-to-end, sempre azzerato
// prima della run: così i test sono riproducibili (stessa email/password
// dell'amministratore seedato) e non toccano il database di sviluppo.
export default function globalSetup() {
  const percorsoDb = path.resolve(process.cwd(), "prisma/e2e-test.db");
  rmSync(percorsoDb, { force: true });
  rmSync(`${percorsoDb}-journal`, { force: true });

  const env = { ...process.env, DATABASE_URL: `file:${percorsoDb}` };
  execSync("npx prisma migrate deploy", { env, stdio: "inherit" });
  execSync("npx prisma db seed", { env, stdio: "inherit" });
}
