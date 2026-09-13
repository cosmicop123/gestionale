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
| Amministratore | Tutto: dati ente, anni sociali, utenti. I moduli soci/contabilità/corsi arriveranno con le prossime milestone. |
| Segreteria, Tesoriere, Docente, Sola lettura | Possono accedere ma non vedono ancora la sezione Amministrazione: i moduli di loro competenza non sono ancora stati costruiti. |

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

## Anni sociali

Da **Amministrazione → Anni sociali** puoi creare un nuovo anno sociale
(es. "2027/2028") indicando le date di inizio e fine, e chiudere un anno
già concluso. **Attenzione**: la chiusura di un anno sociale non è
reversibile da qui — usala solo quando l'anno è davvero terminato.

## Cosa aspettarsi nelle prossime milestone

| Milestone | Cosa diventa utilizzabile |
|---|---|
| M3 | Quote, ricevute, prima nota — **da qui il gestionale è già utilizzabile per soci e cassa** |
| M4 | Corsi, appello, attestati |
| M5 | Iscrizione online ai corsi, consensi privacy, gestione minori |
| M6 | Rendiconto per cassa, report contabili |
| M7 | Eventi, pratiche SIAE, sponsor, raccolte fondi |
| M8 | Verbali, protocollo, archivio documenti |
| M9 | Invio email e comunicazioni |
| M10 | Backup/ripristino da interfaccia, log di controllo |
