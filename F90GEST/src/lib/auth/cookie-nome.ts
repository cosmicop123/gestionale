// Nome del cookie di sessione, isolato in un file senza altre dipendenze
// (niente Prisma, niente "server-only") così può essere importato anche dal
// proxy: la guida ufficiale di Next.js sconsiglia di far dipendere il proxy
// da moduli condivisi pesanti.
export const NOME_COOKIE_SESSIONE = "f90gest_sessione";
