import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

// Prisma 7 richiede un driver adapter esplicito anche per SQLite. Il pattern
// del global singleton evita di riaprire connessioni ad ogni hot-reload in
// sviluppo (next dev ricarica i moduli ma non il processo Node).
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function creaPrismaClient() {
  const adapter = new PrismaBetterSqlite3({
    url: process.env.DATABASE_URL ?? "file:./dev.db",
  });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? creaPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
