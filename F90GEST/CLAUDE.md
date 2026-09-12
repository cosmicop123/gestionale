# CLAUDE.md — F90GEST

Gestionale web self-hosted per l'Associazione Culturale Frequenze 90 (San
Donaci, BR). Sostituisce Excel/WhatsApp/PDF sparsi con un unico sistema
tracciabile: socio → quota → ricevuta → movimento di cassa. Deve reggere un
controllo fiscale o un'ispezione: numerazioni progressive senza buchi,
append-only dove richiesto, nessuna consulenza fiscale nei testi.

La specifica di progetto completa (fornita dall'utente) è la fonte di verità
per requisiti e regole di business; questo file descrive **come** ci si
muove nel codice, non ripete il **cosa**.

## Stato del progetto

- **Milestone corrente: M0 (setup) completata.** Repo, Next.js, Tailwind,
  Prisma, Docker, struttura cartelle pronti. Nessuna UI funzionale oltre
  login (non wired) e layout applicativo.
- Prossima milestone: **M1 — Auth, ruoli, anagrafica ente (wizard di primo
  avvio), anni sociali, utenti.**
- Le milestone si susseguono una alla volta con conferma dell'utente a fine
  di ognuna (si veda il piano di lavoro nella specifica, §10). Non scrivere
  codice per più di una milestone alla volta.

## Decisioni di design confermate (non ridiscutere senza motivo)

1. **`Socio` è immutabile dopo la creazione** (persona, numeroLibroSoci,
   date di ammissione non cambiano mai). Lo stato corrente (in_attesa /
   attivo / sospeso / cessato) vive in `SocioStato`, storico append-only con
   periodo di validità. Il libro soci "a una data di riferimento" si
   ricostruisce interrogando `SocioStato`, mai un campo mutabile su `Socio`.
2. **`Riunione` è un modello unico** per Assemblea e Consiglio Direttivo
   (campo `tipo`), con `RiunionePartecipante` e `Delibera` collegate.
3. **`Allegato` è un modello generico** (entitaTipo + entitaId, non FK
   relazionale) per tutti i file caricati nel sistema.
4. **`Numeratore`** centralizza ogni numerazione progressiva (ricevute per
   anno solare, protocollo entrata/uscita per anno, libro soci mai
   riassegnato, attestati, verbali). L'incremento avviene sempre dentro una
   transazione Prisma (`$transaction`) per evitare buchi/duplicati.
5. **Niente fatturazione elettronica**: l'ente non ha P.IVA e non è
   iscritto RUNTS. Il campo `naturaFiscale` e il flag `iscrittoRunts` tengono
   il modello pronto per un'eventuale iscrizione futura, ma non si implementa
   nulla di più finché non richiesto esplicitamente.
6. **Sessioni in DB** (pattern Lucia-style, tabella `Sessione`), non JWT:
   permette la revoca immediata (es. sospensione di un utente).
7. **Mono-ente**: una sola riga `Associazione`. Nessun `organizationId`
   sparso nelle tabelle.
8. **Wizard di primo avvio (M1)**: `Associazione.configurazioneCompletata`
   parte `false` dal seed con dati segnaposto generici; l'app deve guidare
   la personalizzazione dell'anagrafica ente al primo accesso
   dell'amministratore, prima di sbloccare il resto delle funzionalità.

## Realtà tecniche di questo stack (scoperte durante il setup, non nel training)

Il progetto usa **Next.js 16.3.5**, non 15: alcune convenzioni sono cambiate
in modo sostanziale rispetto a quanto ci si aspetterebbe da Next 15. Prima
di scrivere codice che tocca routing, cookie, server actions o config,
verificare contro `node_modules/next/dist/docs/01-app/` se qualcosa non
torna. Punti principali già affrontati:

- `params`, `searchParams`, `cookies()`, `headers()` sono **sempre async**,
  senza fallback sincrono (throw se usati in modo sincrono).
- `middleware.ts` è deprecato → usare **`proxy.ts`** con funzione esportata
  `proxy` (non `middleware`). Gira solo su Node.js runtime (niente edge).
  Per il check di sessione nel proxy: solo verifica ottimistica del cookie,
  mai query al DB (il proxy gira anche sulle richieste di prefetch).
- Turbopack è il default per `next dev`/`next build` (nessun flag da
  passare/rimuovere negli script).
- `next.config.ts`: niente `serverRuntimeConfig`/`publicRuntimeConfig`
  (rimossi), `images.domains` deprecato in favore di `remotePatterns`.

**Prisma è alla 7.10.0** (attenzione: il dist-tag `latest` su npm punta
oggi a una release candidate 8.0.0-rc — pinnare sempre `7.10.0` esplicito,
mai installare `prisma`/`@prisma/client` senza versione). Cambiamenti
rilevanti rispetto a Prisma 5/6:

- Niente più `url` nel blocco `datasource` dello schema: la connessione si
  configura in **`prisma.config.ts`** (root del progetto).
- **Serve un driver adapter esplicito** anche per SQLite:
  `@prisma/adapter-better-sqlite3`, passato al costruttore di
  `PrismaClient` (vedi `src/lib/prisma.ts`). Senza adapter il client lancia
  `PrismaClientInitializationError` a runtime.
- Il generator `provider = "prisma-client-js"` (quello "classico") è ancora
  supportato e usato in questo progetto; l'alternativa `"prisma-client"` con
  output custom esiste ma non è stata adottata per restare più vicini alle
  convenzioni note.
- Prisma non supporta `enum` nativi su datasource SQLite: tutti i campi
  enum-like nello schema sono `String`, con i valori ammessi in un commento
  e validati lato applicazione da schemi zod condivisi
  (`src/lib/validazioni/`).
- Un upsert su un indice composto **non accetta `null`** in uno dei campi
  della chiave (es. `Numeratore` con `annoRiferimento` nullable): usare
  `findFirst` + `create` invece di `upsert` in questi casi.

**shadcn/ui non è installato via CLI**: la CLI attuale richiede una
chiamata di rete verso `ui.shadcn.com`, bloccata dalla policy di rete di
alcuni ambienti (incluso quello di sviluppo iniziale di questo progetto). I
componenti in `src/components/ui/` sono scritti a mano seguendo lo stile
"new-york" classico (Radix + `class-variance-authority` + `tailwind-merge`),
con `components.json` presente per compatibilità futura nel caso la rete
sia disponibile (`npx shadcn add <componente>`). Se si aggiunge un nuovo
componente e la rete verso `ui.shadcn.com` risulta raggiungibile, usare pure
la CLI; altrimenti seguire lo stesso pattern dei file esistenti.

**`xlsx` (SheetJS) da npm ha vulnerabilità note senza fix pubblicato**
(prototype pollution, ReDoS) — SheetJS raccomanda la distribuzione dal
proprio CDN invece del pacchetto npm. Nella milestone M2 (import soci da
Excel), applicare limiti di dimensione file e timeout sul parsing prima di
esporre l'import a file caricati dall'utente.

## Convenzioni di codice

- TypeScript strict ovunque, niente `any` implicito (verificato da
  `npm run build`).
- Terminologia di dominio in italiano ovunque: nomi di modelli Prisma,
  variabili di business, label UI, messaggi di errore, contenuti PDF/email.
  Non tradurre dall'inglese: usare i termini del mondo associativo
  (*socio*, *tesseramento*, *quota associativa*, *libro soci*, *prima
  nota*, *rendiconto per cassa*, *consiglio direttivo*, *verbale*,
  *protocollo*).
- Commenti: **italiano** per spiegare regole di business/riferimenti
  normativi (con estremi di legge dove pertinente), **inglese** per note
  tecniche generiche.
- Percorso alias `@/*` → `src/*`.
- Validazione: schema zod in `src/lib/validazioni/`, condivisi tra client
  (react-hook-form + `@hookform/resolvers/zod`) e server (server actions).
- Ogni server action che scrive dati deve rivalidare l'autorizzazione lato
  server (mai fidarsi solo del fatto che un bottone sia nascosto in UI).
- Operazioni multi-tabella (es. incasso quota → pagamento → movimento →
  ricevuta) vanno sempre in un'unica `prisma.$transaction`.
- Entità append-only (`Socio`, `SocioStato`, `MovimentoPrimaNota`,
  `Ricevuta`, `AuditLog`) non espongono mai update/delete sui campi
  identificativi: solo nuove righe (storni, transizioni di stato).

## Comandi utili

```bash
npm run dev          # sviluppo (Turbopack)
npm run build        # build di produzione + type-check strict
npm run lint         # ESLint
npm run test         # unit test (Vitest)
npm run test:e2e     # test end-to-end (Playwright)
npm run seed         # popola i dati minimi/demo (idempotente)
npm run db:migrate   # nuova migrazione Prisma in sviluppo
npm run db:studio    # Prisma Studio (esplorazione dati)
```

## Struttura cartelle

```
prisma/schema.prisma       Schema dati completo (§5 della specifica)
prisma/seed.ts             Seed minimo (ente segnaposto, admin, parametri, numeratori)
prisma.config.ts           Configurazione Prisma 7 (datasource, migrazioni, seed)
src/app/                   Route Next.js (App Router)
src/app/login/             Pagina di accesso (UI; logica in M1)
src/app/(app)/             Route group con layout applicativo autenticato
src/components/ui/         Componenti shadcn/ui scritti a mano
src/components/layout/     Sidebar, barra superiore, navigazione moduli
src/lib/prisma.ts          Singleton PrismaClient con driver adapter
src/lib/validazioni/       Schemi zod condivisi client/server
e2e/                       Test Playwright
```
