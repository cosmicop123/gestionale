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

- **M0, M1, M2, M3, M4, M5, M6, M7 e M8 completate.** M0: setup. M1: auth, ruoli,
  anagrafica ente, anni sociali, utenti. M2: anagrafica persone con
  validazione CF completa, flusso domanda di ammissione → delibera → libro
  soci, import Excel/CSV, scheda socio, tessere. M3: conti, tipi di quota,
  quote, pagamenti con generazione automatica di movimento e ricevuta,
  prima nota con storni, riporto automatico del saldo alla chiusura
  dell'anno sociale. M4: corsi con calendario lezioni generato
  automaticamente, iscrizioni interne con gestione della lista d'attesa,
  appello mobile (manuale o via scansione QR) con salvataggio immediato,
  registro presenze in PDF, calcolo automatico di ore frequentate e
  percentuale di presenza, generazione massiva degli attestati solo per
  chi supera la soglia, scheda docente con accesso limitato ai propri
  corsi. M5: pagina pubblica di iscrizione ai corsi (nessuna
  autenticazione), gestione dell'informativa privacy da Amministrazione,
  consensi GDPR granulari e separati (mai preselezionati) raccolti al
  momento dell'iscrizione, gestione dei minori con dati del genitore/tutore
  obbligatori, revisione interna delle preiscrizioni pubbliche prima della
  conferma. **Da qui il sistema è utilizzabile in produzione anche per la
  raccolta di iscrizioni online**, come richiesto dal piano a milestone
  (§10). M6: rendiconto per cassa (Mod. D / Mod. E forma aggregata)
  generato dai movimenti di prima nota per anno sociale, con mappatura
  categoria→sezione parametrica ed editabile, PDF scaricabile, report
  sulle entrate potenzialmente commerciali (§7.3). M7: eventi con
  partecipazioni (censite o a nome libero), check-in manuale o via QR,
  incasso dell'evento in prima nota, turni volontari, pratiche SIAE con
  programma musicale su archivio brani riutilizzabile, sponsor/contributi
  con incasso che genera movimento automatico, raccolte fondi occasionali
  (collegate o meno a un evento) con i propri movimenti. M8: libri sociali
  con riunioni di assemblea/consiglio direttivo numerate progressivamente
  per tipo, convocati con gestione delle deleghe, presenze, quorum
  costitutivo/deliberativo, delibere con esito e conteggio voti, verbale
  testuale con generazione PDF su richiesta (non persistito), registro di
  protocollo in entrata/uscita numerato per anno e tipo, archivio documenti
  dell'associazione con categorie, scadenze e versionamento (nuove versioni
  non cancellano le precedenti).
- **Da qui in avanti l'utente ha chiesto di procedere in automatico su
  tutte le milestone rimanenti (M8-M10), senza fermarsi per conferma dopo
  ognuna** — istruzione esplicita che sostituisce, per il resto del
  progetto, il fermo-dopo-milestone previsto da §10.
- Prossima milestone: **M9 — Comunicazioni** (email via nodemailer,
  segmentazione destinatari, template con variabili) e **modulo Privacy**
  completo (registro dei trattamenti, richieste dell'interessato — accesso,
  rettifica, cancellazione —, revoca consensi), esplicitamente rimandato da
  M5 a M9.

### Note di continuità per M8 (da tenere presenti in M9+)

- **Nessuna migrazione Prisma necessaria**: `Riunione`, `RiunionePartecipante`,
  `Delibera`, `Protocollo`, `Documento` erano già completi nello schema di
  M0.
- **Numerazione progressiva per tipo, non globale**: le riunioni usano
  `prossimoNumero(tx, \`riunione_${dati.tipo}\`)` (senza `annoRiferimento`:
  numerazione unica e continua nel tempo per tipo, come richiesto per un
  libro verbali) mentre il protocollo usa
  `prossimoNumero(tx, \`protocollo_${dati.tipo}\`, annoRiferimento)` (annuale,
  come un registro di protocollo tradizionale). Stessa funzione centralizzata
  di numerazione (`src/lib/numeratore.ts`) usata da libro soci/ricevute/
  attestati, solo con chiavi diverse — nessuna nuova infrastruttura.
- **Verbale PDF generato on-demand, non persistito**: a differenza delle
  ricevute/attestati (generati una volta e salvati come `Allegato`), il PDF
  del verbale (`src/app/(app)/libri-sociali/riunioni/[riunioneId]/verbale/pdf/route.ts`)
  viene renderizzato al momento del download da `VerbaleDocument`
  (`src/lib/riunione/verbale-pdf.tsx`), perché il testo del verbale può
  essere corretto/integrato dopo la riunione (a differenza di un importo o
  di un nome, il cui valore è definitivo al momento dell'emissione).
- **Riuso della rotta generica di download allegati**: i link di apertura
  di `Documento` e `Protocollo` puntano a `/contabilita/allegati/[allegatoId]`,
  la stessa rotta creata in M3 per gli allegati di prima nota — confermata
  pienamente generica (non specifica alla contabilità) prima di riusarla,
  invece di duplicarne una nuova per il modulo documenti.
- **Versionamento documenti additivo**: `caricaNuovaVersioneDocumento`
  incrementa `Documento.versione` e salva il nuovo `Allegato`, ma non
  cancella l'allegato della versione precedente (resta su disco,
  raggiungibile solo indirettamente) — coerente con la logica "mai perdere
  uno storico" già vista per l'append-only, anche se `Documento` non è
  formalmente nell'elenco append-only di §7.1 (usa `deletedAt` per la
  cancellazione logica, non `delete` reale).
- **Pattern e2e per Checkbox controllati dal server**: `.check()` di
  Playwright si aspetta un toggle sincrono del checkbox nativo; i checkbox
  di questa app sono controllati da `checked={prop}` e cambiano stato solo
  dopo che `router.refresh()` risolve, quindi `.check()` va sempre sostituito
  con `.click()` seguito da un separato `await expect(locator).toBeChecked()`
  (che effettua polling) — capitato nei test di presenza/quorum di
  `e2e/09-libri-sociali-documenti.spec.ts`, stesso principio del bug dei
  `defaultValues` di M7 ma per lo stato controllato invece che per il valore
  iniziale.
- **Ambiguità badge "Approvata" durante l'animazione di uscita di un
  Dialog**: un `<Dialog>` Radix può restare brevemente montato durante
  l'animazione di chiusura dopo `setAperto(false)`, per cui un testo
  presente sia nel dialog (in fase di chiusura) sia nella tabella
  sottostante genera una violazione di strict mode in `getByText` —
  risolto con `.first()` quando l'elemento corretto è garantito essere il
  primo nel DOM, stesso principio già visto per il mirror `<select>`
  nascosto dei componenti `Select`.

### Note di continuità per M7 (da tenere presenti in M8+)

- **Nessuna migrazione Prisma necessaria**: `Evento`, `PraticaSIAE`,
  `BranoMusicale`, `ProgrammaMusicalePratica`, `PartecipazioneEvento`,
  `TurnoVolontario`, `SponsorContributo`, `RaccoltaFondi` erano già
  completi nello schema di M0.
- **Incasso evento cumulativo, non per singola partecipazione**: si è
  scelto di NON generare un movimento di prima nota per ogni
  `PartecipazioneEvento` (a differenza delle quote corso di M7-bis, dove
  ogni iscrizione ha la propria quota): l'incasso reale di un evento
  (biglietti/oblazioni raccolti alla porta) è quasi sempre un unico
  versamento in cassa che può differire dalla somma nominale dichiarata
  per singolo partecipante. `registraIncassoEvento` (`src/lib/evento/actions.ts`)
  registra quindi un solo movimento cumulativo collegato via `eventoId`,
  con importo suggerito ma modificabile dal tesoriere.
- **`PartecipazioneEvento`/`TurnoVolontario` non sono append-only**: a
  differenza di `Socio`/`MovimentoPrimaNota`/`Ricevuta`, questi due modelli
  non sono nell'elenco append-only della specifica (§7.1), quindi
  `rimuoviPartecipazione`/`rimuoviTurnoVolontario` fanno una `delete` reale
  (nessun campo `deletedAt` in questi due modelli) — corretto per come
  sono definiti, non un errore da correggere.
- **Sponsor/contributi generalizzati**: `SponsorContributo` può essere
  collegato a un evento, a una raccolta fondi, o a nessuno dei due (sponsor
  "generico", es. sponsorizzazione annuale): `creaSponsorContributo` accetta
  entrambi gli id come opzionali. `TabSponsorGlobale`
  (`/eventi/sponsor`, elenco di tutti gli sponsor) e `TabSponsorEvento`
  (dentro la scheda di un evento) condividono gli stessi dialog
  (`src/components/evento/sponsor-dialogs.tsx`, `DialogNuovoSponsor` e
  `DialogIncassaSponsor`) invece di duplicare il form.
- **Programma musicale SIAE riusa un archivio di brani** (`BranoMusicale`,
  già pensato come tabella riutilizzabile tra pratiche diverse): aggiungere
  un brano al programma di una pratica permette di scegliere un brano già
  censito oppure crearne uno nuovo al volo, senza dover prima passare da
  una gestione separata dell'archivio.
- **QR check-in eventi riusa lo scanner dei corsi**: il componente
  `ScannerQr` (wrapper di `BarcodeDetector`, con fallback manuale se non
  supportato) è stato estratto da `src/components/corso/appello-client.tsx`
  a `src/components/shared/qr-scanner.tsx` e riusato tale e quale in
  `src/components/evento/check-in-client.tsx` — stesso principio del check-in
  degli eventi e dell'appello dei corsi (un QR per iscrizione/partecipazione,
  mai un self-check-in pubblico non autenticato, §6).
- **Bug reale trovato e corretto durante i test e2e di M7**: `DialogIncasso`
  (`src/components/evento/tab-partecipazioni.tsx`) precompilava l'importo
  suggerito con `useForm({ defaultValues: {...} })`, ma react-hook-form
  applica `defaultValues` una sola volta al primo mount — se il componente
  resta montato (aggiunta di un partecipante seguita, nella stessa sessione,
  dall'apertura del dialog di incasso), il valore suggerito restava quello
  calcolato al mount iniziale, tipicamente zero. Corretto con un
  `useEffect` che fa `reset(...)` quando il dialog si apre (`aperto` passa
  a `true`), ricalcolando il default sui props correnti. **Nota per il
  futuro**: qualunque dialog che precompila un campo da un valore derivato
  da props che possono cambiare mentre il componente resta montato
  necessita dello stesso pattern (o della prop `values` di react-hook-form
  7.44+, non usata qui per non ri-sincronizzare continuamente un campo che
  l'utente può voler modificare a mano). In questa stessa occasione si è
  notato che diversi dialog del modulo Eventi non mostravano i messaggi di
  errore di validazione (`errors.campo`) sotto i campi obbligatori — corretto
  ovunque mancasse, perché un fallimento di validazione silenzioso (nessun
  submit, nessun feedback) è indistinguibile da un bug per chi usa l'app.
- **Convenzione e2e confermata anche qui**: `getByText` su un valore che
  compare anche come opzione di un `<Select>` (Radix mantiene un
  `<select>` nativo nascosto per l'accessibilità/autofill, con le stesse
  opzioni) va quasi sempre scoped a `getByRole("cell"|"row", ...)` per
  evitare violazioni di strict mode — capitato più volte nei test di M7
  (`e2e/08-eventi.spec.ts`), stesso principio già annotato per i `combobox`
  multipli in pagina nelle note di M4.

### Nota fuori milestone: giustificativi via foto e ricevute per corsi/servizi

Su richiesta esplicita dell'utente (non parte del piano a milestone), durante M7:

- **Upload giustificativo con scatto foto da mobile**: l'input file
  dell'allegato giustificativo in `TabPrimaNota` ora ha
  `accept="image/*,application/pdf"`, che sui browser mobile espone
  "Scatta foto" tra le opzioni del selettore nativo, oltre a poter caricare
  un file già salvato. Nessuna nuova dipendenza: il flusso di upload
  (`registraMovimentoManuale`, invariato) già gestiva qualunque mimetype.
- **Ricevute per corsi e altri servizi a pagamento**: la pipeline
  Quota → Pagamento → Ricevuta di M3 era già generica (`TipoQuota`/`Quota`
  non richiedono che la persona sia socia, `naturaFiscale` include già
  `corrispettivo_specifico` per servizi non associativi) — mancava solo
  l'integrazione diretta nel modulo Corsi. Aggiunta `generaQuotaIscrizioneCorso`
  (`src/lib/iscrizione-corso/quota.ts`): crea (una sola volta per corso,
  riusata per tutti gli iscritti) un `TipoQuota` dedicato e una `Quota`
  collegata via `Quota.iscrizioneCorsoId` — colonna già prevista dallo
  schema di M0 e mai popolata prima d'ora. Il pagamento e la ricevuta
  restano quelli di sempre (`registraPagamentoQuota`, invariato). La tab
  Iscrizioni dei corsi mostra ora una colonna "Quota" con il bottone
  "Genera quota" (se il corso ha un `quotaPartecipazione`), poi lo stato
  della quota e il link alla ricevuta una volta pagata.
  `generaQuotaSingola` (`src/lib/quota/actions.ts`) è stata esportata e
  estesa con un parametro opzionale `iscrizioneCorsoId`, riusata sia dal
  flusso quote associative sia da questo.
- Lo stesso schema (Quota già pronta per `iscrizioneEventoId`) potrà
  coprire in futuro anche le partecipazioni a pagamento degli eventi di
  M7, se richiesto: non ancora fatto per restare nello scope di quanto
  chiesto ora.

### Note di continuità per M6 (da tenere presenti in M7+)

- **Nessuna migrazione Prisma necessaria**: `MovimentoPrimaNota.categoriaRendiconto`
  esisteva già da M3 con un commento che rimandava esplicitamente a questa
  milestone per la mappatura sullo schema Mod. D.
- **La mappatura categoria→sezione (A-E) è un Parametro, non una costante
  hardcoded** (`contabilita.mappatura_categorie_rendiconto`, JSON): il
  default proposto (`MAPPATURA_RENDICONTO_DEFAULT` in `src/lib/parametri.ts`,
  duplicato nel seed) è un punto di partenza ragionevole, non una
  determinazione fiscale — editabile da Contabilità → Rendiconto (§12,
  "non inventare regole fiscali, esporre solo parametri"). La struttura a 5
  sezioni A-E e la soglia di 60.000 € per la forma aggregata sono state
  verificate con una ricerca mirata (DM 5/3/2020 Mod. D, DM 18/2/2026
  Mod. E) prima di implementare, stesso principio già seguito per il
  codice fiscale in M2: mai inventare uno schema normativo a memoria senza
  verifica.
- **`calcolaRendiconto`** (`src/lib/rendiconto/calcola.ts`) è una funzione
  pura: somma i movimenti per sezione secondo la mappatura, e se una
  categoria non ha mappatura la somma comunque nei totali generali ma la
  segnala a parte (`categorieNonMappate`) invece di scartarla o forzarla in
  una sezione a caso — una categoria nuova non deve mai alterare
  silenziosamente i totali.
- **PDF on-demand, non persistito** (stesso pattern di tessera/registro
  presenze): il rendiconto riflette lo stato corrente dei movimenti; non è
  un documento append-only-critico di per sé (l'eventuale verbale di
  approvazione dell'assemblea sarà competenza di M8 "Libri sociali").
- **`ottieniDatiRendiconto`** (`src/lib/rendiconto/dati.ts`) centralizza le
  query condivise tra la pagina di consultazione e la generazione del PDF:
  riusarlo per qualunque futuro export dello stesso rendiconto invece di
  duplicare le query.
- **Report natura fiscale (§7.3)** nella tab Rendiconto: espone solo il
  totale dei movimenti già segnati `ricavoCommerciale` al momento della
  registrazione (M3), non introduce alcuna nuova qualificazione fiscale.

### Note di continuità per M5 (da tenere presenti in M6+)

- **Nessuna migrazione Prisma necessaria**: i modelli `Informativa`,
  `Consenso`, `RelazioneFamiliare` erano già completi nello schema di M0.
- **La pagina pubblica (`/iscrizione`, `/iscrizione/[corsoId]`) vive fuori
  dal route group `(app)`** (stesso livello di `/login`, `/onboarding`),
  senza sidebar né sessione richiesta: aggiunta esplicitamente a
  `ROTTE_PUBBLICHE` in `src/proxy.ts`. Entrambe le pagine impostano
  `export const dynamic = "force-dynamic"` — senza di questo Next tenta di
  pre-renderle in fase di build (nessun cookie/header letto per innescare
  automaticamente il rendering dinamico) e la build fallisce contro un
  database che a quel punto non esiste ancora.
- **L'informativa privacy non è mai generata dal software**: il testo lo
  scrive/incolla l'associazione da Amministrazione → Informativa privacy
  (`src/lib/informativa/actions.ts`, `pubblicaInformativa`, solo
  amministratore). Ogni pubblicazione crea una nuova riga `Informativa`
  (mai un update: i consensi già raccolti restano legati per sempre alla
  versione mostrata al momento, `Consenso.informativaId`); `versione` è
  semplicemente il timestamp ISO di pubblicazione. Finché non esiste
  nessuna `Informativa`, la pagina pubblica mostra un messaggio e non offre
  il modulo (mai un'iscrizione senza informativa mostrata, §7.5).
- **Consensi granulari e mai preselezionati** (§7.5): il form pubblico
  (`src/components/iscrizione-pubblica/modulo-iscrizione.tsx`) parte con
  tutti i checkbox dei consensi a `false`. Solo `trattamento_finalita_associative`
  è obbligatorio per inviare la richiesta (serve all'associazione per
  poter gestire l'iscrizione); gli altri tre tipi (`immagini_video`,
  `newsletter_promozionale`, `comunicazione_terzi`) sono facoltativi. Viene
  comunque creata una riga `Consenso` per ciascuno dei 4 tipi, anche
  quando negato (`stato: "negato"`), per avere una traccia completa di
  cosa è stato chiesto e di come la persona ha risposto — non solo dei
  consensi accordati.
- **Preiscrizioni pubbliche sempre in stato "preiscritto", mai confermate
  automaticamente**: a differenza del flusso interno di M4
  (`iscriviPersona`, che salta "preiscritto" e va dritto a
  "confermato"/"in_lista_attesa"), ogni iscrizione arrivata dal form
  pubblico (`src/lib/iscrizione-pubblica/actions.ts`,
  `inviaPreiscrizionePubblica`) resta "preiscritto" anche se ci sono posti
  liberi: la segreteria deve poter verificare dati e consensi prima di
  confermarla. `confermaIscrizione` (`src/lib/iscrizione-corso/actions.ts`)
  è stata estesa per accettare anche questo stato in ingresso, e se nel
  frattempo la capienza si è esaurita sposta la persona in lista d'attesa
  invece di limitarsi a un errore senza via d'uscita.
- **Nessuna sovrascrittura di anagrafica esistente da un form non
  autenticato**: se il codice fiscale inviato corrisponde a una `Persona`
  già censita, `inviaPreiscrizionePubblica` riusa quell'id ma aggiorna
  *solo* i campi contatto attualmente vuoti (mai un dato già presente) —
  altrimenti chiunque conoscesse il codice fiscale di un socio potrebbe
  alterarne l'anagrafica tramite un modulo pubblico. Stesso principio per
  `RelazioneFamiliare`: se ne esiste già una per il minore, non viene
  toccata.
- **Rate limiting sul form pubblico**: riusa
  `verificaELimitaTentativi`/`src/lib/auth/rate-limit.ts` (già usato per il
  login) con chiave `iscrizione-pubblica:<ip>`, per limitare lo spam senza
  introdurre una nuova dipendenza o infrastruttura (§4, niente Redis).
- **Gestione minori sul form pubblico riusa la logica già scritta in M2**:
  `isMinorenne` (`src/lib/persona/eta.ts`) decide quando mostrare la
  sezione del genitore, e `schemaGenitore` (ora esportato da
  `src/lib/validazioni/persona.ts`, prima privato) è condiviso tra il form
  interno di creazione persona e il nuovo `schemaIscrizionePubblica`
  (`src/lib/validazioni/consenso.ts`) per non duplicare le regole. Il
  genitore/tutore inserito da un form pubblico non diventa mai una
  `Persona` censita a sé (evita di popolare l'anagrafica di terzi non
  verificati): resta nei campi liberi di `RelazioneFamiliare`
  (`genitoreNomeCognome`/`genitoreCodiceFiscale`/...), esattamente come già
  previsto dallo schema per il caso "genitore non ancora censito".
- **Rimandato a M9** (modulo "Privacy" completo, coerente con
  `moduli-navigazione.ts`): amministrazione del `RegistroTrattamenti`,
  gestione di `RichiestaInteressato` (accesso/rettifica/cancellazione),
  revoca dei consensi già dati, esportazione dei dati di una persona. M5
  copre solo la raccolta dei consensi al momento dell'iscrizione pubblica.

### Note di continuità per M4 (da tenere presenti in M5+)

- **Nessuna migrazione Prisma necessaria**: lo schema proposto in M0 già
  copriva per intero i modelli di M4 (`Corso`, `CorsoDocente`, `Modulo`,
  `Lezione`, `IscrizioneCorso`, `Presenza`, `Attestato`, `Questionario` e
  collegati) — verificato prima di iniziare a scrivere codice.
- **Calendario lezioni**: `src/lib/corso/calendario.ts` (`generaCalendarioLezioni`)
  è una funzione pura (nessun accesso al DB) che calcola le date dalla
  cadenza settimanale + festività da escludere; usata da `creaCorso`
  (`src/lib/corso/actions.ts`) dentro un'unica transazione insieme alla
  creazione del corso e delle righe `Lezione` (`createMany`). La modifica
  di un corso già creato (`modificaCorso`) non rigenera mai il calendario,
  per non rischiare di disallineare lezioni/presenze già registrate: le
  lezioni si aggiungono/modificano singolarmente dalla scheda corso.
- **Calcolo ore/percentuale di presenza**: `src/lib/presenza/calcolo-presenze.ts`
  è un'altra funzione pura (`calcolaPresenze`, `haDirittoAttestato`), con
  la regola di business esplicitata nei commenti: solo le lezioni con
  `stato: "svolta"` contano al denominatore (una lezione rinviata/annullata
  non deve penalizzare la percentuale), e solo `presente`/`ritardo` contano
  come ore frequentate. `src/lib/presenza/riepilogo.ts`
  (`calcolaRiepilogoPresenzeIscrizione`) è il punto che interroga il DB e
  costruisce l'input per la funzione pura — da riusare per qualunque
  futuro calcolo di frequenza (es. eventi in M7, se mai richiesto).
- **Lista d'attesa iscrizioni** (`src/lib/iscrizione-corso/actions.ts`):
  `iscriviPersona` assegna automaticamente lo stato `confermato` o
  `in_lista_attesa` in base alla capienza massima del corso; `ritiraIscrizione`
  promuove automaticamente la prima persona in lista d'attesa (per data di
  iscrizione) quando si libera un posto, dentro la stessa transazione dello
  storno) — mai un'assegnazione manuale dei posti fuori ordine.
- **Attestati**: stesso pattern delle ricevute di M3
  (`src/lib/attestato/genera.ts`) — numerazione atomica via `prossimoNumero`
  dentro la transazione che crea la riga `Attestato`, PDF generato e
  allegato solo dopo il commit (`generaEAllegaPdfAttestato`). La
  generazione massiva (`src/lib/attestato/actions.ts`, `generaAttestatiCorso`)
  itera sulle iscrizioni non ritirate senza attestato, salta chi non
  raggiunge `Corso.percentualeMinimaPresenzaAttestato` e non tocca mai chi
  ha già un attestato (mai una doppia emissione).
- **Registro presenze PDF rigenerato al volo** (non persistito): a
  differenza delle ricevute/attestati non è un documento
  append-only-critico, riflette semplicemente lo stato corrente delle
  presenze — stesso pattern della tessera di M2.
- **Appello via QR senza nuove dipendenze npm**: la scansione usa l'API
  nativa del browser `BarcodeDetector` (feature-detected, con messaggio di
  fallback esplicito sull'appello manuale se non supportata, es. Firefox/Safari
  meno recenti) invece di aggiungere una libreria di scansione non prevista
  dallo stack fisso (§12). Ogni iscrizione ha un proprio QR (generato con
  `qrcode`, già in uso per le tessere) che codifica semplicemente il proprio
  id: la scansione da parte del docente/segreteria autenticato richiama la
  stessa `registraPresenza` usata dall'appello manuale (`metodo: "qr"`), non
  è un self-check-in pubblico (i soci non hanno un proprio accesso al
  gestionale, §6).
- **Scheda docente con accesso limitato**: il ruolo `docente` vede in
  `/corsi` solo i corsi dove `CorsoDocente.personaId` coincide con
  `Utente.personaId` della propria sessione (`src/app/(app)/corsi/page.tsx`
  e `[corsoId]/page.tsx`, con redirect se un docente tenta di aprire un
  corso non proprio); può fare l'appello e cambiare lo stato di una lezione
  (`modificaLezione`, `registraPresenza`) ma non gestire iscrizioni, docenti
  o generare attestati (resta riservato ad amministratore/segreteria).

### Note di continuità per M3 (da tenere presenti in M4+)

- **Transazione finanziaria completa** in `src/lib/pagamento/actions.ts`
  (`registraPagamentoQuota`): Pagamento + MovimentoPrimaNota + Ricevuta +
  aggiornamento stato Quota + eventuale transizione SocioStato
  `in_attesa`→`attivo`, tutto in una `prisma.$transaction`. È il pattern di
  riferimento per qualunque futura registrazione finanziaria (es. incassi
  di iscrizioni a corsi/eventi in M4/M7): replicarlo, non reinventarlo.
- **PDF delle ricevute generati una volta e persistiti** (a differenza
  della tessera in M2, rigenerata on-demand): `src/lib/ricevuta/genera.ts`
  separa la creazione della riga DB (dentro la transazione, con
  numerazione atomica via `prossimoNumero`) dalla generazione del file
  (dopo il commit, per non tenere una scrittura su disco dentro la
  transazione DB). Il file finisce in `STORAGE_DIR` via `src/lib/storage.ts`
  con una riga `Allegato` collegata. Stesso pattern da riusare per ogni
  futuro documento append-only-critico (es. attestati in M4, se si decide
  di persisterli anziché rigenerarli).
- **Bollo e categorie di rendiconto sono parametriche**, non hardcoded:
  `Parametro.contabilita.nature_fiscali_soggette_a_bollo` (JSON) decide per
  quali nature fiscali scatta il bollo oltre soglia — il software non
  decide da solo quali nature lo richiedano (§12, "non inventare regole
  fiscali"). Le categorie di prima nota (`src/lib/validazioni/contabilita.ts`,
  `CATEGORIE_RENDICONTO_*`) sono una tassonomia **provvisoria**: la mappatura
  puntuale allo schema del Mod. D (DM 5/3/2020) è compito di M6
  ("Rendiconto per cassa") — non anticiparla ora, i movimenti già
  registrati restano compatibili perché il campo è una stringa libera.
- **Riporto automatico del saldo** (§7.2): `creaAnnoSociale` copia il
  saldo finale dell'anno precedente chiuso come saldo iniziale del nuovo
  anno per ogni conto; `chiudiAnnoSociale` calcola e blocca il saldo
  finale di ogni conto sommando i movimenti compresi tra `dataInizio` e
  `dataFine` dell'anno (non esiste un campo `annoSocialeId` su
  `MovimentoPrimaNota`: l'attribuzione è sempre per intervallo di date,
  scelta di design da mantenere coerente nelle prossime milestone).
- **Upload di file dentro una server action**: `registraMovimentoManuale`
  accetta `FormData` invece di un oggetto tipizzato da react-hook-form,
  perché è l'unico modo per inviare testo e file nello stesso submit. Per
  evitare un update su una riga append-only, l'id del movimento viene
  generato lato applicazione (`randomUUID()`) *prima* di salvare
  l'eventuale allegato, così l'`Allegato` e il `MovimentoPrimaNota` si
  creano entrambi una sola volta, in ordine, mai con un update successivo.
  Riusare lo stesso schema per qualunque futuro upload legato a una riga
  append-only.
- **Turbopack e filesystem dinamico**: l'accesso a `STORAGE_DIR` (variabile
  d'ambiente) in `src/lib/storage.ts` va marcato con
  `/* turbopackIgnore: true */` sul `join(...)`, altrimenti la build
  traccia ed impacchetta l'intero progetto nell'output del server
  (warning, non errore, ma da evitare).
- **Test e2e multipli condividono un solo database** (`e2e-test.db`,
  ricreato una volta sola all'inizio della run da `global-setup.ts`, non
  per singolo file): i file di test sono numerati (`01-login`, `02-soci`,
  `03-contabilita`, `04-corsi`, `05-iscrizione-pubblica`, `06-rendiconto`,
  `07-quota-corso`, `08-eventi`, `09-libri-sociali-documenti`) apposta,
  perché Playwright con `workers: 1` li esegue in ordine alfabetico e
  alcuni assumono lo stato lasciato dai precedenti (es. `02-soci` richiede
  che l'onboarding sia già stato completato da `01-login`,
  `04-corsi`/`07-quota-corso`/`08-eventi`/`09-libri-sociali-documenti`
  riusano la persona "Giulia Verdi" e il conto "Cassa contanti" creati in
  `03-contabilita`, `05-iscrizione-pubblica` pubblica la propria
  informativa privacy e crea il proprio corso, e `06-rendiconto` verifica
  che il saldo di cassa e il movimento categorizzato "quote_associative"
  di `03-contabilita` compaiano correttamente nel rendiconto).
  Se si aggiungono nuovi file di test E2E che dipendono da uno stato
  pregresso, dar loro un prefisso numerico coerente con l'ordine di
  dipendenza invece di dare per scontato l'ordine alfabetico naturale dei
  nomi. **Nota locale**: in questo ambiente di sviluppo la variabile
  d'ambiente `PLAYWRIGHT_CHROMIUM_PATH` (letta da `playwright.config.ts`)
  va impostata a `/opt/pw-browsers/chromium` per eseguire `test:e2e`,
  altrimenti Playwright cerca l'eseguibile "headless shell" non installato.

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
