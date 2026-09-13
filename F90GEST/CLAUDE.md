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

- **M0, M1 e M2 completate.** M0: setup. M1: auth, ruoli, anagrafica ente,
  anni sociali, utenti. M2: anagrafica persone con validazione CF completa,
  flusso domanda di ammissione → delibera → libro soci, import Excel/CSV,
  scheda socio, tessere con QR in PDF formato tesserino.
- Prossima milestone: **M3 — Quote, pagamenti, ricevute, prima nota** con
  automatismi e transazioni. Dopo questa milestone il sistema deve essere
  già utilizzabile in produzione per soci e cassa (§10 della specifica).
- Le milestone si susseguono una alla volta con conferma dell'utente a fine
  di ognuna (si veda il piano di lavoro nella specifica, §10). Non scrivere
  codice per più di una milestone alla volta.

### Note di continuità per M2 (da tenere presenti in M3+)

- **Nuovo modello `DomandaAmmissione`**, non previsto nello schema
  originale proposto in M0: necessario perché "il numero di libro soci si
  assegna alla delibera, non alla domanda" (§6), quindi deve poter esistere
  una domanda prima che esista un `Socio` (che richiede `numeroLibroSoci`
  non nullo e univoco). Vedi `prisma/schema.prisma` e la migrazione
  `20260913090850_aggiunge_domanda_ammissione`. Se emergono altri casi in
  cui lo schema proposto in M0 non regge il flusso reale, estendere lo
  schema con una nuova migrazione è normale e atteso, non un errore da
  evitare — va solo documentato qui col perché.
- **Stato iniziale del socio all'ammissione è `in_attesa`, non `attivo`**:
  la specifica descrive il flusso come domanda → delibera → iscrizione →
  **pagamento quota** → tessera. La transizione a `attivo` va implementata
  in M3 dentro la stessa transazione che registra l'incasso della quota
  (`prisma.socioStato.create` con `dataInizio` = data pagamento, senza mai
  aggiornare la riga precedente: è append-only, vedi §7.1).
- **`prossimoNumero()`** in `src/lib/numeratore.ts` è il punto unico per
  ottenere un numero progressivo dentro una transazione (già usato per
  `libro_soci`): riusarlo tale e quale per `ricevuta`, `protocollo_entrata`,
  `protocollo_uscita`, `attestato` nelle prossime milestone.
- **Import Excel/CSV**: il parsing con `xlsx` (SheetJS) avviene
  interamente **nel browser** (`src/components/persona/importazione-soci.tsx`),
  mai sul server — solo i dati già mappati sui campi noti (stringhe) vengono
  inviati alla server action, che li **rivalida da capo** con la stessa
  `validaRigaImport` usata per l'anteprima (mai fidarsi della validazione
  lato client, §8). Questo evita anche l'esposizione delle vulnerabilità
  note di SheetJS in lettura (che riguardano il parsing) al processo
  server. Riusare lo stesso pattern per qualunque futuro import di file
  (es. import corsi/iscrizioni, se mai richiesto).
- **PDF generati on-demand, non persistiti**: la tessera
  (`/soci/tessere/[id]/pdf`) viene rigenerata ad ogni richiesta invece di
  essere salvata come `Allegato`. Va bene per un documento non
  append-only-critico come la tessera; le **ricevute** (M3) sono invece
  append-only per specifica (§7.4) e quindi il loro PDF andrà generato una
  volta all'emissione e conservato (come `Allegato`), mai rigenerato al
  volo con dati che potrebbero cambiare nel tempo (es. dati ente).
- **Formato pagina PDF non standard** (tesserino ID-1, 85,6×54mm) con
  `@react-pdf/renderer`: funziona passando `size={[larghezzaPt, altezzaPt]}`
  a `<Page>`. Un visualizzatore PDF generico può mostrare margini vuoti
  intorno se non rispetta esattamente il MediaBox nella sua anteprima: prima
  di sospettare un bug di layout, verificare il MediaBox reale nel file
  (`grep MediaBox` sul PDF) invece di fidarsi solo del rendering
  dell'anteprima.
- **Codice fiscale**: l'algoritmo (`src/lib/persona/codice-fiscale.ts`) è
  stato verificato confrontandolo con la libreria open source indipendente
  `codice-fiscale-js` (stesse tabelle carattere per carattere) — utile
  saperlo se in futuro serve estendere la decodifica (es. aggiungere la
  verifica del codice catastale del comune, oggi esplicitamente non
  implementata per mancanza di una tabella dei comuni verificata).

### Note di continuità per M1 (da tenere presenti in M2+)

- Autenticazione: `src/lib/auth/session.ts` (sessioni httpOnly in DB,
  pattern "Lucia-style" manuale — cookie = token in chiaro, DB = solo hash
  SHA-256), `src/lib/auth/password.ts` (argon2), `src/lib/auth/rate-limit.ts`
  (in-memory, 5 tentativi/15 min per IP+email), `src/lib/auth/richiedi-utente.ts`
  (`richiediUtente()`/`richiediRuolo([...])`: usarli in OGNI pagina server e
  OGNI server action che legge/scrive dati sensibili, mai fidarsi della sola
  UI). `src/proxy.ts` fa solo un controllo ottimistico sulla presenza del
  cookie (mai una query DB nel proxy): la validazione reale è sempre server-side.
- Wizard di primo avvio: `Associazione.configurazioneCompletata` blocca
  l'accesso al resto dell'app per l'amministratore finché non è true
  (redirect a `/onboarding`, vedi `src/app/(app)/layout.tsx`). Il form
  ente è condiviso (`src/components/ente/ente-form.tsx`) tra onboarding e
  la tab "Dati ente" di `/amministrazione`.
- Pattern form: react-hook-form + zod ovunque; per componenti Radix
  controllati (Select, Checkbox) usare sempre `Controller`, mai
  `watch()`/`setValue()` passati come prop — genera un warning del React
  Compiler ("incompatible library") e rischia UI non aggiornata.
- Regola di sicurezza applicativa già implementata: non si può mai
  disattivare o retrocedere l'ultimo amministratore attivo rimasto
  (`src/lib/utenti/actions.ts`, `modificaUtente`) — replicare lo stesso tipo
  di guardia per altre invarianti simili quando emergono.
- `AuditLog` viene già scritto per login/logout/creazione-modifica utenti e
  modifiche all'anagrafica ente (`src/lib/audit.ts`); non c'è ancora una UI
  per consultarlo (arriva in M10), ma il pattern (`registraAudit(...)`) va
  riusato per ogni nuova scrittura sensibile introdotta nelle prossime
  milestone.
- Test end-to-end: `e2e/global-setup.ts` ricrea un DB SQLite dedicato
  (`prisma/e2e-test.db`, mai committato) con migrate+seed ad ogni run, così
  i test restano riproducibili. Playwright gira a un solo worker
  (`fullyParallel: false`) perché il flusso critico muta stato condiviso
  (completa l'onboarding, crea/chiude entità). Estendere questo stesso file
  di test (`e2e/login.spec.ts`) o aggiungerne altri seguendo lo stesso
  pattern di global-setup per i flussi critici delle prossime milestone.

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
