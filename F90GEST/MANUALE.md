# Manuale utente — F90GEST

Guida in linguaggio semplice all'uso del gestionale, pensata per chi non ha
competenze informatiche avanzate (presidente, segreteria, tesoriere,
docenti). Viene ampliata ad ogni milestone, via via che i moduli diventano
disponibili.

## Primo accesso (amministratore)

1. Apri il gestionale nel browser e inserisci l'email e la password che ti
   sono state comunicate (se è il primissimo avvio: `admin@example.org` /
   `CambiaSubito!2026`).
2. Al primo accesso ti verrà chiesto di **personalizzare i dati
   dell'associazione**: denominazione, codice fiscale, sede legale,
   contatti. Puoi lasciare vuoti i campi facoltativi e completarli in
   seguito da **Amministrazione → Dati ente**, dove puoi anche **caricare
   il logo dell'associazione** (PNG, JPEG, SVG o WebP): una volta caricato
   comparirà nel menu laterale, nella pagina di accesso, nella pagina
   pubblica di iscrizione, nel sito vetrina generato e sulle ricevute PDF.
   Nella stessa pagina puoi caricare anche la **firma del Presidente**
   (un'immagine, idealmente con sfondo trasparente) e il testo da mostrare
   sotto di essa (es. "Il Presidente Mario Rossi"): compariranno insieme in
   calce a tutte le ricevute emesse da quel momento in poi — le ricevute
   già emesse non cambiano aspetto retroattivamente.
3. Una volta salvati i dati, entri nella Dashboard.
4. Per **cambiare la tua password** o creare accessi per altre persone
   (segreteria, tesoriere, docenti): vai su **Amministrazione → Utenti**.
   - "Nuovo utente": crea un accesso con email, ruolo e una password
     iniziale che dovrai comunicare tu stesso alla persona interessata
     (via telefono, di persona — non via email, per ora).
   - Icona matita: cambia il ruolo di un utente o lo sospende
     (impedendogli di accedere, senza cancellarlo).
   - Icona chiave: reimposta la password di un utente (utile anche per
     cambiare la tua).

## Ruoli disponibili

| Ruolo | Cosa può fare oggi |
|---|---|
| Amministratore | Tutto: dati ente, anni sociali, utenti, soci, contabilità, corsi. |
| Segreteria | Soci, contabilità e corsi (gestione completa: iscrizioni, docenti, attestati). |
| Tesoriere | Soci in consultazione, contabilità in scrittura. |
| Docente | Vede solo i propri corsi in **Corsi**: può fare l'appello e segnare lo stato delle lezioni, non gestire iscrizioni o generare attestati. |
| Sola lettura | Consulta soci, contabilità e corsi senza poter modificare nulla. |

## Soci

Da **Soci e tesseramenti** puoi:

- **Creare una nuova persona**: nome, cognome, codice fiscale (verificato
  automaticamente), data di nascita, contatti. Se la persona è minorenne,
  il modulo chiede automaticamente i dati di un genitore o tutore: è
  obbligatorio compilarli. Nella sezione "Tessere" del modulo puoi
  registrare, se presenti, il **numero di tessera socio** (il numero
  fisico della tessera associativa, indipendente dal numero di libro
  soci) e il **numero di tessera ENAC** — entrambi facoltativi e
  modificabili in qualunque momento dalla scheda della persona.
- **Avviare una domanda di ammissione a socio** dalla scheda della persona,
  indicando la categoria proposta (ordinario, sostenitore, onorario,
  junior).
- **Approvare o respingere la domanda**: l'approvazione richiede la data
  della delibera del direttivo e assegna automaticamente il numero di
  libro soci (mai riutilizzato, nemmeno se in futuro il socio dovesse
  cessare). Da qui in poi la persona è socia, con stato "in attesa" finché
  non pagherà la quota (funzione che arriva con la milestone M3).
- **Emettere una tessera**: genera un numero tessera con QR per l'anno
  sociale scelto; il PDF (formato tesserino, stampabile) si scarica con un
  click.
- **Consultare il libro soci a una data scelta**: mostra chi risultava
  socio in quel momento, con possibilità di esportare l'elenco in CSV o
  Excel.
- **Importare un elenco soci già esistente da Excel o CSV**: carica il
  file, abbina le colonne ai campi del gestionale, controlla l'anteprima
  (le righe con errori vengono segnalate e non importate) e conferma.

## Contabilità

Da **Contabilità** (visibile ad amministratore e tesoriere in scrittura, a
segreteria e sola lettura in sola consultazione):

- **Conti**: crea la cassa contanti e gli eventuali conti correnti,
  indicando il saldo iniziale la prima volta. Il saldo corrente si
  aggiorna da solo man mano che registri incassi e uscite.
- **Tipi di quota**: definisci gli importi delle quote per l'anno sociale
  in corso (es. "Quota associativa 2026/2027", 30 €).
- **Quote**: dalla scheda di un socio puoi generare una quota singola;
  da qui puoi anche fare un **rinnovo massivo** selezionando più soci in
  una volta sola.
- **Registrare un incasso**: dalla scheda del socio, sulla quota da
  pagare, premi "Registra pagamento". Il gestionale crea automaticamente
  il movimento di prima nota e la ricevuta numerata — **non serve mai
  inserirli a mano separatamente**. Se il socio era "in attesa" (quota non
  ancora pagata), passa automaticamente ad "attivo".
- **Ricevute**: scaricabili in PDF in qualsiasi momento; se emessa per
  errore, si annulla (mai cancellata) indicando il motivo.
- **Correggere la numerazione delle ricevute** (solo amministratore,
  bottone "Correggi numerazione" nella tab Ricevute): utile se inizi a
  usare il gestionale dopo aver già emesso ricevute "a mano" nello stesso
  anno — indica l'anno e il numero da cui vuoi che riparta la prossima
  ricevuta emessa dal gestionale. Tutte le ricevute già registrate nel
  gestionale per quell'anno vengono annullate in blocco (restano
  consultabili con la dicitura "ANNULLATA", non vengono mai cancellate) e
  la numerazione riparte pulita dal numero che hai indicato.
- **Prima nota**: puoi registrare anche movimenti non legati a una quota
  (es. una spesa per materiali). Per le uscite oltre una certa soglia è
  obbligatorio allegare uno scontrino/fattura oppure spiegare perché non
  c'è. Da smartphone puoi **scattare direttamente una foto** del
  giustificativo invece di caricare un file già salvato. Un movimento
  sbagliato si **storna** (si annulla con un movimento di segno opposto),
  non si cancella mai.
- **Quote, corsi e altri servizi a pagamento**: da **Tipi di quota** puoi
  creare non solo quote associative ma qualsiasi servizio a pagamento
  (es. tessera assicurativa, noleggio sala), scegliendo la natura fiscale
  più adatta; la quota generata si incassa e riceve esattamente come una
  quota associativa. Per i corsi con una quota di partecipazione, questo è
  già integrato direttamente nella scheda del corso (vedi sezione Corsi).
- **Chiusura dell'anno sociale**: quando chiudi un anno da Amministrazione,
  il gestionale calcola da solo il saldo finale di ogni conto; il nuovo
  anno sociale parte automaticamente con quel saldo come saldo iniziale.

## Corsi

Da **Corsi** puoi:

- **Creare un nuovo corso**, con la possibilità di **generare
  automaticamente il calendario delle lezioni**: basta indicare data di
  inizio, numero di lezioni, giorni della settimana e durata di ciascuna
  lezione (ed eventuali festività da escludere); in alternativa si possono
  aggiungere le lezioni una alla volta in un secondo momento.
- **Assegnare uno o più docenti** al corso, dalla scheda del corso.
- **Iscrivere una persona al corso**: se la capienza massima è già
  raggiunta, l'iscrizione va automaticamente **in lista d'attesa** e viene
  promossa a "confermata" in automatico non appena si libera un posto
  (es. per un ritiro).
- **Fare l'appello** da cellulare o tablet durante la lezione: tocca lo
  stato di presenza per ciascun iscritto (presente, assente, giustificato,
  ritardo) e viene salvato subito, senza bisogno di un pulsante "salva"
  finale. In alternativa, ogni iscritto ha un proprio codice QR (visibile
  dall'icona accanto al suo nome): inquadrandolo con la fotocamera durante
  l'appello lo si segna presente in un tocco (funzione disponibile solo nei
  browser che supportano la scansione QR nativa; altrimenti si usa
  l'appello manuale).
- **Scaricare il registro presenze in PDF** di ogni lezione, pronto per la
  firma di chi era presente.
- **Generare gli attestati di frequenza in blocco** a fine corso: il
  gestionale calcola da solo ore frequentate e percentuale di presenza per
  ciascun iscritto e genera l'attestato solo per chi supera la soglia
  minima impostata sul corso (di default il 70%, modificabile).
- Un **docente** vede in questa sezione solo i corsi a cui è stato
  assegnato, e può fare l'appello ma non gestire iscrizioni o generare
  attestati (riservato ad amministratore e segreteria).
- Se il corso ha una **quota di partecipazione**, dalla tab Iscrizioni puoi
  premere **"Genera quota"** sull'iscrizione e poi **"Incassa"** per
  registrare il pagamento: il gestionale crea da solo il movimento di
  prima nota e la ricevuta, esattamente come per una quota associativa —
  non serve inserirli a mano separatamente.

## Iscrizione pubblica ai corsi e privacy

Da **Amministrazione → Informativa privacy** l'amministratore incolla il
testo dell'informativa sul trattamento dei dati che l'associazione ha
predisposto (con il proprio consulente o DPO, se presente): il gestionale
non scrive né propone alcun testo al posto vostro. **Finché non viene
pubblicata almeno una volta, la pagina pubblica di iscrizione resta
disattivata** e mostra un messaggio invece del modulo.

Una volta pubblicata l'informativa, ogni corso con stato "Aperto alle
iscrizioni" compare automaticamente sulla pagina pubblica
`/iscrizione`, condivisibile con chiunque (es. sul sito o sui social
dell'associazione) senza che serva un accesso al gestionale. Da lì una
persona può:

- Compilare i propri dati e scegliere il corso a cui iscriversi.
- Se la persona da iscrivere è minorenne, il modulo chiede automaticamente
  anche i dati di un genitore o tutore (obbligatori).
- Dare o negare separatamente ciascun consenso: solo quello per il
  trattamento dei dati necessario a gestire l'iscrizione è obbligatorio;
  immagini/video, newsletter e comunicazione a terzi restano facoltativi e
  **nessuna casella è già spuntata di default**.

Ogni iscrizione arrivata da questa pagina compare come **"Preiscritto"**
nella scheda del corso (tab Iscrizioni): la segreteria verifica i dati e i
consensi e poi preme **Conferma** — se nel frattempo i posti si sono
esauriti, la persona passa automaticamente in lista d'attesa invece di
restare bloccata. Nessuna iscrizione pubblica diventa mai "Confermata" in
automatico, nemmeno se ci sono posti liberi: la conferma resta sempre una
decisione della segreteria.

## Rendiconto per cassa

Da **Contabilità → Rendiconto** puoi consultare, per ciascun anno sociale,
il rendiconto per cassa nello schema previsto per gli enti del terzo
settore (Mod. D, o Mod. E in forma aggregata per chi ha entrate fino a
60.000 €): entrate e uscite divise nelle 5 sezioni A-E, avanzo/disavanzo
di esercizio, saldo di cassa e banca a inizio e fine periodo.

- **Mappatura categorie → sezioni**: decide tu (o il tuo consulente) a
  quale sezione appartiene ciascuna categoria di prima nota; il
  gestionale propone un default ragionevole ma **non decide al posto
  vostro** — verificatela prima di approvare il rendiconto.
- **Forma aggregata**: attivabile/disattivabile con un clic; mostra solo i
  totali per sezione invece del dettaglio per categoria.
- **Scarica il PDF** del rendiconto in qualsiasi momento.
- La sezione **"Entrate potenzialmente commerciali"** riprende i movimenti
  già segnalati come tali al momento della registrazione: è solo
  un'informazione di sintesi, non una qualificazione fiscale automatica.

## Eventi

Da **Eventi** puoi gestire spettacoli, feste, conferenze e altre attività
non formative:

- **Crea un evento** indicando tipologia, date, luogo e tipo di ingresso
  (gratuito, oblazione volontaria o a pagamento).
- **Aggiungi i partecipanti**, censiti o anche solo con un nome (per chi
  non è socio né altrimenti in anagrafica), e registra il **check-in**
  all'ingresso — manualmente o inquadrando con la fotocamera il codice QR
  personale di ciascun partecipante (pagina **Check-in**, dalla scheda
  dell'evento).
- Se l'evento prevede un incasso, **"Registra incasso"** crea il movimento
  di prima nota corrispondente in un colpo solo (un unico versamento
  cumulativo, come tipicamente avviene per un incasso raccolto alla porta,
  non un movimento per ogni singolo biglietto).
- **Turni volontari**: proponi un turno a un volontario per una mansione e
  un orario, poi confermalo o segnalalo come rifiutato.
- **Pratica SIAE**: predisponi la pratica per l'evento (tipo di permesso,
  stato, importi, protocollo), carica il bordero degli incassi quando
  disponibile, e componi il **programma musicale** scegliendo i brani da
  un archivio riutilizzabile (o aggiungendone di nuovi).
- **Sponsor e contributi**: registra una sponsorizzazione, un'erogazione
  liberale o un contributo pubblico legato all'evento (o a una raccolta
  fondi, o a nessuno dei due); quando viene accettato e poi incassato, il
  gestionale genera da solo il movimento di prima nota.
- **Raccolte fondi**: da **Eventi → Raccolte fondi** puoi tenere traccia di
  una raccolta fondi occasionale (collegata o meno a un evento specifico),
  registrandone entrate e uscite e vedendo il saldo raccolto in tempo
  reale.

## Libri sociali

Da **Libri sociali** puoi tenere il registro delle riunioni di assemblea e
di consiglio direttivo:

- **Crea una riunione** indicando il tipo (assemblea o consiglio
  direttivo), data, ora, sede e ordine del giorno: riceve un numero
  progressivo proprio per tipo (le assemblee e i consigli direttivi hanno
  numerazioni separate, come nel libro verbali cartaceo).
- **Convocati e presenze**: aggiungi le persone convocate (eventualmente
  con delega da un'altra persona) e segna chi è effettivamente presente il
  giorno della riunione.
- **Quorum**: spunta se il quorum costitutivo e/o deliberativo risultano
  verificati.
- **Delibere**: registra ogni delibera con oggetto, esito (approvata,
  respinta, rinviata) ed eventuale conteggio dei voti.
- **Verbale**: scrivi il testo del verbale e salvalo; il **PDF del
  verbale** si genera al volo ogni volta che lo scarichi, quindi puoi
  correggere o integrare il testo anche dopo la riunione e il PDF
  rifletterà sempre l'ultima versione salvata.

## Documenti e protocollo

Da **Documenti e protocollo**:

- **Documenti**: carica statuto, bilanci, contratti, polizze assicurative
  e altri documenti dell'associazione, con categoria ed eventuale scadenza
  (le scadenze superate sono evidenziate). Caricare una **nuova versione**
  di un documento non cancella quella precedente.
- **Protocollo**: registra la corrispondenza in entrata e in uscita
  (mittente/destinatario, oggetto, mezzo di trasmissione) con un allegato
  facoltativo; ogni protocollo riceve un numero progressivo annuale per
  tipo (entrata/uscita), come un registro di protocollo tradizionale.
- **Modelli di documento**: crea un modello di lettera/modulo ricorrente
  scrivendone il testo e segnando le parti che cambiano ogni volta con un
  segnaposto tra doppie parentesi, ad esempio `{{nome_destinatario}}` o
  `{{data_assemblea}}`. Il gestionale riconosce automaticamente ogni
  segnaposto usato e lo mostra come promemoria (etichetta) nell'elenco dei
  modelli. Quando devi generare un documento da un modello, clicca "Genera
  documento": ti verranno chiesti solo i valori dei segnaposto di quel
  modello, poi puoi scegliere se **scaricare subito il PDF** (senza
  salvarlo da nessuna parte) oppure **generarlo e salvarlo in archivio**
  (compare tra i "Documenti", con la categoria che scegli). Utile per
  lettere di convocazione, moduli di richiesta, comunicazioni standard che
  ripeti spesso cambiando solo nome, data o pochi altri dettagli.

## Comunicazioni

Da **Comunicazioni** puoi inviare email a gruppi di persone:

- **Nuova comunicazione**: scegli il segmento di destinatari (soci attivi,
  iscritti a un corso specifico, soci con quote scadute non pagate,
  volontari, oppure una selezione personalizzata di persone), scrivi
  oggetto e testo dell'email usando variabili come `{{nome}}`, `{{cognome}}`
  e, a seconda del segmento, `{{corso}}` oppure `{{importo}}`/`{{scadenza}}`
  (mostrate sotto il campo segmento).
- La comunicazione resta in **bozza** finché non premi **"Invia ora"**:
  puoi rileggerla o eliminarla prima di quel momento.
- Dopo l'invio, la scheda della comunicazione mostra l'esito per ciascun
  destinatario (inviata, fallita, oppure non inviata perché la persona ha
  revocato il consenso alla newsletter).
- **Attenzione**: l'invio richiede un server email configurato — da
  **Amministrazione → Email e PEC** (vedi sotto) oppure, in assenza di una
  casella configurata lì, dalle variabili d'ambiente SMTP impostate
  dall'amministratore di sistema. Senza nessuna delle due configurazioni
  gli invii risultano tutti "falliti".
- **Posta in arrivo**: in questa stessa pagina, la tab "Posta in arrivo"
  mostra i messaggi scaricati dalle caselle email configurate (vedi sotto).
  Clicca "Sincronizza tutte le caselle" per scaricare i messaggi nuovi, poi
  clicca su un messaggio per leggerlo (si segna automaticamente come
  letto).

## Email e PEC (Amministrazione)

Da **Amministrazione → Email e PEC** puoi configurare le caselle email con
cui il gestionale invia le comunicazioni e scarica la posta in arrivo —
sia una casella **ordinaria** (es. la email istituzionale
dell'associazione) sia una casella **PEC** (Posta Elettronica Certificata).

- **"Nuova casella"**: inserisci tipo (ordinaria o PEC), un nome
  descrittivo, l'indirizzo email, e i parametri per **invio (SMTP)** e
  **ricezione (IMAP)** forniti dal tuo gestore di posta — host, porta,
  tipo di sicurezza (nessuna, STARTTLS o TLS/SSL), utente e password.
  Questi dati si trovano solitamente nelle istruzioni di configurazione
  manuale del tuo provider email o PEC (es. Aruba, Poste, Gmail, ecc.).
- Solo una casella di tipo "ordinaria" **attiva** alla volta viene usata
  per inviare le comunicazioni del modulo omonimo; se nessuna è attiva, il
  gestionale usa la configurazione SMTP da variabili d'ambiente (se
  presente).
- L'icona a forma di presa ("Verifica connessione") controlla che le
  credenziali inserite funzionino davvero, senza inviare né scaricare
  nulla — utile per capire subito se un parametro è sbagliato.
- L'icona di sincronizzazione scarica i messaggi nuovi di quella casella
  (consultabili da Comunicazioni → Posta in arrivo); in modifica, lasciare
  vuoto un campo password mantiene quella già salvata.
- Le password inserite qui vengono sempre cifrate prima di essere salvate,
  non sono mai leggibili in chiaro nemmeno da chi ha accesso al database.

## Privacy

Da **Privacy**:

- **Registro dei trattamenti**: tieni l'elenco dei trattamenti di dati
  effettuati dall'associazione (finalità, base giuridica, categorie di
  dati e di interessati, tempi di conservazione, misure di sicurezza), come
  richiesto dalla normativa sulla protezione dei dati.
- **Richieste dell'interessato**: registra una richiesta di accesso,
  rettifica o cancellazione ricevuta da una persona. Per le richieste di
  **accesso** puoi generare ed esportare un file con un riepilogo dei dati
  che il gestionale conserva su quella persona. Per tutte le richieste,
  registra poi l'esito (cosa è stato fatto) — la valutazione di come
  evadere una rettifica o una cancellazione, specie quando ci sono dati che
  vanno conservati per obblighi fiscali, resta una decisione
  dell'associazione: il gestionale non cancella né modifica nulla in
  automatico.
- **Consensi**: cerca una persona per vedere lo stato attuale dei suoi
  consensi (trattamento dati, immagini e video, newsletter, comunicazione a
  terzi) e **revocarne** uno su richiesta, indicando come è arrivata la
  richiesta di revoca.

## Backup e ripristino

Da **Amministrazione → Backup e ripristino**:

- **Scarica backup** produce un unico file ZIP con database e tutti gli
  allegati (ricevute, documenti, foto dei giustificativi, verbali, ecc.):
  è l'unico file da conservare (es. su un disco esterno o uno spazio cloud
  personale) per poter ripristinare tutto in caso di necessità. Si
  consiglia di scaricarlo regolarmente e di conservarne più di una copia,
  in posti diversi da dove gira il gestionale.
- **Ripristino**: carica un file di backup precedentemente scaricato per
  sostituire database e allegati attuali con quelli del backup. Prima di
  procedere devi digitare la frase di conferma richiesta a video: è
  un'operazione irreversibile (anche se viene comunque salvata
  automaticamente una copia di sicurezza dello stato attuale prima di
  sovrascrivere nulla). **Dopo il ripristino è necessario riavviare
  l'applicazione** (o il container Docker) perché il ripristino sia
  effettivo — un messaggio a video lo ricorda al termine dell'operazione.

## Registro di controllo

Da **Amministrazione → Registro di controllo** puoi consultare lo storico
di chi ha fatto cosa nel gestionale (creazioni, modifiche, accessi,
esportazioni, backup...), con data, ora, utente ed entità coinvolta. È un
registro di sola consultazione: nessuna voce può essere modificata o
cancellata, nemmeno dagli amministratori.

## Sito pubblico

Da **Amministrazione → Sito pubblico** puoi generare un sito vetrina
statico (una singola pagina HTML, senza bisogno di alcun server o
programmazione) con le informazioni dell'associazione e l'elenco dei corsi
attualmente aperti alle iscrizioni o in corso:

- **Presentazione** (facoltativa): un breve testo mostrato nella sezione
  "Chi siamo" del sito.
- **URL pubblico del gestionale** (facoltativo): se lo indichi, i corsi nel
  sito generato avranno un pulsante "Iscriviti" che porta alla pagina
  pubblica di iscrizione di questo gestionale. Utile perché il sito vetrina
  può essere ospitato altrove (il tuo spazio web, un hosting statico
  gratuito, ecc.), non necessariamente sullo stesso indirizzo del
  gestionale.
- **Tre template pronti** — Classico (sobrio, istituzionale), Moderno
  (essenziale, corsi in schede) e Vivace (caldo, colorato): per ciascuno
  puoi cliccare **Anteprima** per vederlo subito nel browser, oppure
  **Scarica sito** per ottenere un file ZIP con la pagina pronta da
  pubblicare dove preferisci.
- Il gestionale genera il file ma **non lo pubblica online da solo**: la
  pubblicazione (caricarlo sul proprio hosting) resta un passaggio a tua
  cura.

## Anni sociali

Da **Amministrazione → Anni sociali** puoi creare un nuovo anno sociale
(es. "2027/2028") indicando le date di inizio e fine, e chiudere un anno
già concluso. **Attenzione**: la chiusura di un anno sociale non è
reversibile da qui — usala solo quando l'anno è davvero terminato.
