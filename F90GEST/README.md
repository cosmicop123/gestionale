# F90GEST — Gestionale per Associazione Culturale

Gestionale web self-hosted per la gestione di soci, tesseramenti,
contabilità per cassa, corsi, eventi, libri sociali, documenti e
adempimenti GDPR di un'associazione culturale italiana.

> **Stato attuale: milestone M7 completata.** Login, ruoli, anagrafica
> ente, soci con validazione del codice fiscale, libro soci, tessere,
> conti, quote, pagamenti con ricevute e prima nota automatiche, corsi con
> calendario lezioni, iscrizioni con lista d'attesa, appello (anche via QR),
> registro presenze e attestati di frequenza, pagina pubblica di iscrizione
> ai corsi con consensi privacy granulari e gestione dei minori, rendiconto
> per cassa (Mod. D/Mod. E) con mappatura editabile, eventi con
> partecipazioni, check-in, turni volontari, pratiche SIAE, sponsor e
> raccolte fondi sono attivi: **il gestionale è utilizzabile in produzione
> per soci, cassa, corsi, iscrizioni online, rendiconto ed eventi.** Libri
> sociali e comunicazioni arrivano dalle milestone successive (in corso,
> senza fermo per conferma tra una e l'altra). Vedi `CLAUDE.md` per lo
> stato di dettaglio.

## Requisiti

- Node.js 22+ e npm, **oppure** Docker + Docker Compose.
- Nessun servizio cloud esterno richiesto: il database è un file SQLite
  locale e gli allegati sono salvati su disco.

## Avvio in sviluppo (senza Docker)

```bash
cp .env.example .env         # personalizzare i valori se necessario
npm install
npx prisma migrate dev       # crea/aggiorna il database SQLite
npm run seed                 # crea i dati minimi (ente segnaposto, utente amministratore)
npm run dev                  # http://localhost:3000
```

Al primo avvio viene creato un utente amministratore con credenziali
segnaposto stampate a console dal comando `npm run seed`
(email `admin@example.org`, password `CambiaSubito!2026`). Al primo
accesso con queste credenziali, l'amministratore viene guidato in un
wizard per personalizzare i dati dell'associazione; da lì può anche
creare altri utenti e cambiare la propria password da
Amministrazione → Utenti → icona chiave.

## Avvio con Docker (consigliato per l'uso reale)

```bash
cp .env.example .env
# impostare almeno SESSION_SECRET nel file .env, es:
#   openssl rand -base64 32
docker compose up -d --build
```

Il container applica automaticamente le migrazioni del database e verifica
i dati minimi ad ogni avvio (operazione idempotente, sicura anche sui
riavvii). I dati persistono in due volumi Docker:

- `gestionale_db` — il database SQLite (`prisma/data/gestionale.db`)
- `gestionale_storage` — gli allegati caricati nel gestionale

### Aggiornamento

```bash
git pull
docker compose up -d --build
```

Le migrazioni del database si applicano automaticamente all'avvio del
container aggiornato.

## Backup e ripristino

> La procedura di backup/restore guidato da interfaccia (dump DB + allegati
> in un unico archivio ZIP scaricabile con un click) è prevista dalla
> milestone M10. Nel frattempo, backup manuale dei volumi Docker:

```bash
# Backup
docker run --rm \
  -v f90gest_gestionale_db:/db -v f90gest_gestionale_storage:/storage \
  -v "$(pwd)":/backup alpine \
  tar czf /backup/backup-f90gest-$(date +%Y%m%d).tar.gz /db /storage

# Ripristino (container fermo)
docker compose down
docker run --rm \
  -v f90gest_gestionale_db:/db -v f90gest_gestionale_storage:/storage \
  -v "$(pwd)":/backup alpine \
  sh -c "rm -rf /db/* /storage/* && tar xzf /backup/backup-f90gest-AAAAMMGG.tar.gz -C /"
docker compose up -d
```

(Il prefisso `f90gest_` nel nome dei volumi dipende dal nome della cartella
del progetto usato da Docker Compose: verificare con `docker volume ls`.)

## Sviluppo

```bash
npm run build       # build di produzione + verifica TypeScript strict
npm run lint         # ESLint
npm run test         # unit test (Vitest) — regole di business e calcoli
npm run test:e2e     # test end-to-end (Playwright)
npm run db:studio    # Prisma Studio, per ispezionare i dati durante lo sviluppo
```

Convenzioni di progetto, decisioni di design e note tecniche sullo stack
(Next.js 16, Prisma 7, shadcn/ui) sono documentate in `CLAUDE.md`.

## Struttura del progetto

Vedi `CLAUDE.md` → sezione "Struttura cartelle".

## Manuale utente

Il manuale per l'utente finale non tecnico (`MANUALE.md`) viene ampliato ad
ogni milestone via via che i moduli funzionali diventano disponibili.
