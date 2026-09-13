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
   seguito da **Amministrazione → Dati ente**.
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
  obbligatorio compilarli.
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

## Anni sociali

Da **Amministrazione → Anni sociali** puoi creare un nuovo anno sociale
(es. "2027/2028") indicando le date di inizio e fine, e chiudere un anno
già concluso. **Attenzione**: la chiusura di un anno sociale non è
reversibile da qui — usala solo quando l'anno è davvero terminato.

## Cosa aspettarsi nelle prossime milestone

| Milestone | Cosa diventa utilizzabile |
|---|---|
| M7 | Eventi, pratiche SIAE, sponsor, raccolte fondi |
| M8 | Verbali, protocollo, archivio documenti |
| M9 | Invio email e comunicazioni |
| M10 | Backup/ripristino da interfaccia, log di controllo |
