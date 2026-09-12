-- CreateTable
CREATE TABLE "Associazione" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "denominazione" TEXT NOT NULL,
    "codiceFiscale" TEXT NOT NULL,
    "partitaIva" TEXT,
    "sedeLegaleVia" TEXT NOT NULL,
    "sedeLegaleCap" TEXT NOT NULL,
    "sedeLegaleComune" TEXT NOT NULL,
    "sedeLegaleProvincia" TEXT NOT NULL,
    "sedeOperativaVia" TEXT,
    "sedeOperativaCap" TEXT,
    "sedeOperativaComune" TEXT,
    "sedeOperativaProvincia" TEXT,
    "pec" TEXT,
    "email" TEXT,
    "telefono" TEXT,
    "iban" TEXT,
    "logoAllegatoId" TEXT,
    "dataCostituzione" DATETIME,
    "statutoRiferimento" TEXT,
    "iscrittoRunts" BOOLEAN NOT NULL DEFAULT false,
    "numeroRunts" TEXT,
    "regimeFiscale" TEXT,
    "piePaginaRicevute" TEXT,
    "firmaPresidenteAllegatoId" TEXT,
    "configurazioneCompletata" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "createdById" TEXT,
    CONSTRAINT "Associazione_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Utente" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AnnoSociale" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "etichetta" TEXT NOT NULL,
    "dataInizio" DATETIME NOT NULL,
    "dataFine" DATETIME NOT NULL,
    "chiuso" BOOLEAN NOT NULL DEFAULT false,
    "dataChiusura" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "createdById" TEXT,
    CONSTRAINT "AnnoSociale_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Utente" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CaricaSociale" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "personaId" TEXT NOT NULL,
    "ruolo" TEXT NOT NULL,
    "dataInizioMandato" DATETIME NOT NULL,
    "dataFineMandato" DATETIME,
    "estremiVerbaleNomina" TEXT,
    "riunioneNominaId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "createdById" TEXT,
    "deletedAt" DATETIME,
    CONSTRAINT "CaricaSociale_personaId_fkey" FOREIGN KEY ("personaId") REFERENCES "Persona" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "CaricaSociale_riunioneNominaId_fkey" FOREIGN KEY ("riunioneNominaId") REFERENCES "Riunione" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "CaricaSociale_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Utente" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Utente" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "personaId" TEXT,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "ruolo" TEXT NOT NULL,
    "attivo" BOOLEAN NOT NULL DEFAULT true,
    "ultimoAccesso" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "createdById" TEXT,
    "deletedAt" DATETIME,
    CONSTRAINT "Utente_personaId_fkey" FOREIGN KEY ("personaId") REFERENCES "Persona" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Utente_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Utente" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Sessione" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "utenteId" TEXT NOT NULL,
    "ipCreazione" TEXT,
    "userAgent" TEXT,
    "scadenza" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Sessione_utenteId_fkey" FOREIGN KEY ("utenteId") REFERENCES "Utente" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Parametro" (
    "chiave" TEXT NOT NULL PRIMARY KEY,
    "valore" TEXT NOT NULL,
    "descrizione" TEXT,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Numeratore" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "entita" TEXT NOT NULL,
    "annoRiferimento" INTEGER,
    "ultimoNumero" INTEGER NOT NULL DEFAULT 0
);

-- CreateTable
CREATE TABLE "Persona" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nome" TEXT NOT NULL,
    "cognome" TEXT NOT NULL,
    "codiceFiscale" TEXT,
    "dataNascita" DATETIME,
    "comuneNascita" TEXT,
    "provinciaNascita" TEXT,
    "sesso" TEXT,
    "residenzaVia" TEXT,
    "residenzaCap" TEXT,
    "residenzaComune" TEXT,
    "residenzaProvincia" TEXT,
    "email" TEXT,
    "telefono" TEXT,
    "note" TEXT,
    "fotoAllegatoId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "createdById" TEXT,
    "deletedAt" DATETIME,
    CONSTRAINT "Persona_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Utente" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RelazioneFamiliare" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "minoreId" TEXT NOT NULL,
    "genitoreId" TEXT,
    "genitoreNomeCognome" TEXT,
    "genitoreCodiceFiscale" TEXT,
    "genitoreEmail" TEXT,
    "genitoreTelefono" TEXT,
    "gradoParentela" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME,
    CONSTRAINT "RelazioneFamiliare_minoreId_fkey" FOREIGN KEY ("minoreId") REFERENCES "Persona" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "RelazioneFamiliare_genitoreId_fkey" FOREIGN KEY ("genitoreId") REFERENCES "Persona" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RuoloPersona" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "personaId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "dataInizio" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dataFine" DATETIME,
    "attivo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "RuoloPersona_personaId_fkey" FOREIGN KEY ("personaId") REFERENCES "Persona" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Socio" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "personaId" TEXT NOT NULL,
    "numeroLibroSoci" INTEGER NOT NULL,
    "categoria" TEXT NOT NULL,
    "dataDomandaAmmissione" DATETIME NOT NULL,
    "dataDeliberaAmmissione" DATETIME NOT NULL,
    "riunioneDeliberaId" TEXT,
    "dataDecorrenza" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT,
    CONSTRAINT "Socio_personaId_fkey" FOREIGN KEY ("personaId") REFERENCES "Persona" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Socio_riunioneDeliberaId_fkey" FOREIGN KEY ("riunioneDeliberaId") REFERENCES "Riunione" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Socio_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Utente" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SocioStato" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "socioId" TEXT NOT NULL,
    "stato" TEXT NOT NULL,
    "dataInizio" DATETIME NOT NULL,
    "dataFine" DATETIME,
    "motivo" TEXT,
    "estremiDelibera" TEXT,
    "riunioneId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT,
    CONSTRAINT "SocioStato_socioId_fkey" FOREIGN KEY ("socioId") REFERENCES "Socio" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "SocioStato_riunioneId_fkey" FOREIGN KEY ("riunioneId") REFERENCES "Riunione" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "SocioStato_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Utente" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Tesseramento" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "socioId" TEXT NOT NULL,
    "annoSocialeId" TEXT NOT NULL,
    "numeroTessera" TEXT NOT NULL,
    "quotaId" TEXT,
    "dataEmissione" DATETIME,
    "canale" TEXT NOT NULL,
    "qrToken" TEXT NOT NULL,
    "pdfAllegatoId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "createdById" TEXT,
    "deletedAt" DATETIME,
    CONSTRAINT "Tesseramento_socioId_fkey" FOREIGN KEY ("socioId") REFERENCES "Socio" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Tesseramento_annoSocialeId_fkey" FOREIGN KEY ("annoSocialeId") REFERENCES "AnnoSociale" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Tesseramento_quotaId_fkey" FOREIGN KEY ("quotaId") REFERENCES "Quota" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Tesseramento_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Utente" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TipoQuota" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "descrizione" TEXT NOT NULL,
    "importo" DECIMAL NOT NULL,
    "annoSocialeId" TEXT NOT NULL,
    "categoriaSocioApplicabile" TEXT,
    "naturaFiscale" TEXT NOT NULL,
    "ricorrente" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "createdById" TEXT,
    "deletedAt" DATETIME,
    CONSTRAINT "TipoQuota_annoSocialeId_fkey" FOREIGN KEY ("annoSocialeId") REFERENCES "AnnoSociale" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "TipoQuota_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Utente" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Quota" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "personaId" TEXT NOT NULL,
    "tipoQuotaId" TEXT NOT NULL,
    "annoSocialeId" TEXT NOT NULL,
    "importo" DECIMAL NOT NULL,
    "scadenza" DATETIME NOT NULL,
    "stato" TEXT NOT NULL,
    "naturaFiscale" TEXT NOT NULL,
    "iscrizioneCorsoId" TEXT,
    "iscrizioneEventoId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "createdById" TEXT,
    "deletedAt" DATETIME,
    CONSTRAINT "Quota_personaId_fkey" FOREIGN KEY ("personaId") REFERENCES "Persona" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Quota_tipoQuotaId_fkey" FOREIGN KEY ("tipoQuotaId") REFERENCES "TipoQuota" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Quota_annoSocialeId_fkey" FOREIGN KEY ("annoSocialeId") REFERENCES "AnnoSociale" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Quota_iscrizioneCorsoId_fkey" FOREIGN KEY ("iscrizioneCorsoId") REFERENCES "IscrizioneCorso" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Quota_iscrizioneEventoId_fkey" FOREIGN KEY ("iscrizioneEventoId") REFERENCES "PartecipazioneEvento" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Quota_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Utente" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Conto" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nome" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "iban" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME
);

-- CreateTable
CREATE TABLE "SaldoContoAnno" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "contoId" TEXT NOT NULL,
    "annoSocialeId" TEXT NOT NULL,
    "saldoIniziale" DECIMAL NOT NULL,
    "saldoFinale" DECIMAL,
    CONSTRAINT "SaldoContoAnno_contoId_fkey" FOREIGN KEY ("contoId") REFERENCES "Conto" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "SaldoContoAnno_annoSocialeId_fkey" FOREIGN KEY ("annoSocialeId") REFERENCES "AnnoSociale" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Pagamento" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "quotaId" TEXT,
    "causaleLibera" TEXT,
    "controparteId" TEXT,
    "importo" DECIMAL NOT NULL,
    "data" DATETIME NOT NULL,
    "metodo" TEXT NOT NULL,
    "contoId" TEXT NOT NULL,
    "riferimentoEsterno" TEXT,
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT,
    "deletedAt" DATETIME,
    CONSTRAINT "Pagamento_quotaId_fkey" FOREIGN KEY ("quotaId") REFERENCES "Quota" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Pagamento_controparteId_fkey" FOREIGN KEY ("controparteId") REFERENCES "Persona" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Pagamento_contoId_fkey" FOREIGN KEY ("contoId") REFERENCES "Conto" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Pagamento_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Utente" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MovimentoPrimaNota" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "data" DATETIME NOT NULL,
    "tipo" TEXT NOT NULL,
    "importo" DECIMAL NOT NULL,
    "contoId" TEXT NOT NULL,
    "causale" TEXT NOT NULL,
    "categoriaRendiconto" TEXT NOT NULL,
    "controparteId" TEXT,
    "controparteFornitore" TEXT,
    "descrizione" TEXT,
    "allegatoGiustificativoId" TEXT,
    "motivazioneAssenzaGiustificativo" TEXT,
    "ricavoCommerciale" BOOLEAN NOT NULL DEFAULT false,
    "pagamentoId" TEXT,
    "ricevutaId" TEXT,
    "eventoId" TEXT,
    "corsoId" TEXT,
    "raccoltaFondiId" TEXT,
    "stornoDiId" TEXT,
    "motivoStorno" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT,
    CONSTRAINT "MovimentoPrimaNota_contoId_fkey" FOREIGN KEY ("contoId") REFERENCES "Conto" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "MovimentoPrimaNota_controparteId_fkey" FOREIGN KEY ("controparteId") REFERENCES "Persona" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "MovimentoPrimaNota_pagamentoId_fkey" FOREIGN KEY ("pagamentoId") REFERENCES "Pagamento" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "MovimentoPrimaNota_ricevutaId_fkey" FOREIGN KEY ("ricevutaId") REFERENCES "Ricevuta" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "MovimentoPrimaNota_eventoId_fkey" FOREIGN KEY ("eventoId") REFERENCES "Evento" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "MovimentoPrimaNota_corsoId_fkey" FOREIGN KEY ("corsoId") REFERENCES "Corso" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "MovimentoPrimaNota_raccoltaFondiId_fkey" FOREIGN KEY ("raccoltaFondiId") REFERENCES "RaccoltaFondi" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "MovimentoPrimaNota_stornoDiId_fkey" FOREIGN KEY ("stornoDiId") REFERENCES "MovimentoPrimaNota" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "MovimentoPrimaNota_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Utente" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Ricevuta" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "numero" INTEGER NOT NULL,
    "annoSolare" INTEGER NOT NULL,
    "data" DATETIME NOT NULL,
    "intestatarioId" TEXT NOT NULL,
    "causale" TEXT NOT NULL,
    "importo" DECIMAL NOT NULL,
    "naturaFiscale" TEXT NOT NULL,
    "bolloApplicato" BOOLEAN NOT NULL DEFAULT false,
    "importoBollo" DECIMAL,
    "testoNormativoPiede" TEXT,
    "pdfAllegatoId" TEXT,
    "stato" TEXT NOT NULL DEFAULT 'emessa',
    "motivoAnnullamento" TEXT,
    "pagamentoId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT,
    CONSTRAINT "Ricevuta_intestatarioId_fkey" FOREIGN KEY ("intestatarioId") REFERENCES "Persona" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Ricevuta_pagamentoId_fkey" FOREIGN KEY ("pagamentoId") REFERENCES "Pagamento" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Ricevuta_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Utente" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Scadenza" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "titolo" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "dataScadenza" DATETIME NOT NULL,
    "ricorrente" BOOLEAN NOT NULL DEFAULT false,
    "completata" BOOLEAN NOT NULL DEFAULT false,
    "dataCompletamento" DATETIME,
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "createdById" TEXT,
    "deletedAt" DATETIME,
    CONSTRAINT "Scadenza_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Utente" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Corso" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "titolo" TEXT NOT NULL,
    "edizione" TEXT,
    "descrizione" TEXT,
    "destinatari" TEXT,
    "sede" TEXT,
    "dataInizio" DATETIME NOT NULL,
    "dataFine" DATETIME,
    "numeroLezioniPreviste" INTEGER,
    "oreTotali" DECIMAL,
    "capienzaMassima" INTEGER,
    "quotaPartecipazione" DECIMAL,
    "stato" TEXT NOT NULL DEFAULT 'bozza',
    "percentualeMinimaPresenzaAttestato" DECIMAL NOT NULL DEFAULT 70,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "createdById" TEXT,
    "deletedAt" DATETIME,
    CONSTRAINT "Corso_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Utente" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CorsoDocente" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "corsoId" TEXT NOT NULL,
    "personaId" TEXT NOT NULL,
    CONSTRAINT "CorsoDocente_corsoId_fkey" FOREIGN KEY ("corsoId") REFERENCES "Corso" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "CorsoDocente_personaId_fkey" FOREIGN KEY ("personaId") REFERENCES "Persona" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Modulo" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "corsoId" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "titolo" TEXT NOT NULL,
    "argomenti" TEXT,
    CONSTRAINT "Modulo_corsoId_fkey" FOREIGN KEY ("corsoId") REFERENCES "Corso" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Lezione" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "corsoId" TEXT NOT NULL,
    "moduloId" TEXT,
    "numeroProgressivo" INTEGER NOT NULL,
    "titolo" TEXT,
    "argomenti" TEXT,
    "data" DATETIME NOT NULL,
    "oraInizio" TEXT NOT NULL,
    "oraFine" TEXT NOT NULL,
    "durataOre" DECIMAL NOT NULL,
    "docenteEffettivoId" TEXT,
    "aulaSede" TEXT,
    "stato" TEXT NOT NULL DEFAULT 'programmata',
    "noteDocente" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME,
    CONSTRAINT "Lezione_corsoId_fkey" FOREIGN KEY ("corsoId") REFERENCES "Corso" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Lezione_moduloId_fkey" FOREIGN KEY ("moduloId") REFERENCES "Modulo" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Lezione_docenteEffettivoId_fkey" FOREIGN KEY ("docenteEffettivoId") REFERENCES "Persona" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "IscrizioneCorso" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "personaId" TEXT NOT NULL,
    "corsoId" TEXT NOT NULL,
    "dataIscrizione" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "canale" TEXT NOT NULL,
    "stato" TEXT NOT NULL DEFAULT 'preiscritto',
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "createdById" TEXT,
    "deletedAt" DATETIME,
    CONSTRAINT "IscrizioneCorso_personaId_fkey" FOREIGN KEY ("personaId") REFERENCES "Persona" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "IscrizioneCorso_corsoId_fkey" FOREIGN KEY ("corsoId") REFERENCES "Corso" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "IscrizioneCorso_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Utente" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Presenza" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "lezioneId" TEXT NOT NULL,
    "iscrizioneId" TEXT NOT NULL,
    "stato" TEXT NOT NULL,
    "oraIngresso" TEXT,
    "rilevataDaId" TEXT,
    "metodo" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Presenza_lezioneId_fkey" FOREIGN KEY ("lezioneId") REFERENCES "Lezione" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Presenza_iscrizioneId_fkey" FOREIGN KEY ("iscrizioneId") REFERENCES "IscrizioneCorso" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Presenza_rilevataDaId_fkey" FOREIGN KEY ("rilevataDaId") REFERENCES "Utente" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Attestato" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "iscrizioneId" TEXT NOT NULL,
    "numeroProgressivo" INTEGER NOT NULL,
    "oreFrequentate" DECIMAL NOT NULL,
    "percentualePresenza" DECIMAL NOT NULL,
    "dataEmissione" DATETIME NOT NULL,
    "pdfAllegatoId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT,
    CONSTRAINT "Attestato_iscrizioneId_fkey" FOREIGN KEY ("iscrizioneId") REFERENCES "IscrizioneCorso" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Attestato_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Utente" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Questionario" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "corsoId" TEXT NOT NULL,
    "titolo" TEXT NOT NULL,
    "attivo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME,
    CONSTRAINT "Questionario_corsoId_fkey" FOREIGN KEY ("corsoId") REFERENCES "Corso" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DomandaQuestionario" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "questionarioId" TEXT NOT NULL,
    "ordine" INTEGER NOT NULL,
    "testo" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    CONSTRAINT "DomandaQuestionario_questionarioId_fkey" FOREIGN KEY ("questionarioId") REFERENCES "Questionario" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RispostaQuestionario" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "questionarioId" TEXT NOT NULL,
    "iscrizioneId" TEXT NOT NULL,
    "tokenPersonale" TEXT NOT NULL,
    "dataCompilazione" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RispostaQuestionario_questionarioId_fkey" FOREIGN KEY ("questionarioId") REFERENCES "Questionario" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "RispostaQuestionario_iscrizioneId_fkey" FOREIGN KEY ("iscrizioneId") REFERENCES "IscrizioneCorso" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RispostaDomanda" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "rispostaQuestionarioId" TEXT NOT NULL,
    "domandaId" TEXT NOT NULL,
    "valoreScala" INTEGER,
    "testoLibero" TEXT,
    CONSTRAINT "RispostaDomanda_rispostaQuestionarioId_fkey" FOREIGN KEY ("rispostaQuestionarioId") REFERENCES "RispostaQuestionario" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "RispostaDomanda_domandaId_fkey" FOREIGN KEY ("domandaId") REFERENCES "DomandaQuestionario" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DocumentoCorso" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "corsoId" TEXT NOT NULL,
    "allegatoId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DocumentoCorso_corsoId_fkey" FOREIGN KEY ("corsoId") REFERENCES "Corso" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Evento" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "titolo" TEXT NOT NULL,
    "tipologia" TEXT NOT NULL,
    "dataInizio" DATETIME NOT NULL,
    "dataFine" DATETIME,
    "luogo" TEXT,
    "descrizione" TEXT,
    "tipoIngresso" TEXT NOT NULL,
    "capienza" INTEGER,
    "stato" TEXT NOT NULL DEFAULT 'bozza',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "createdById" TEXT,
    "deletedAt" DATETIME,
    CONSTRAINT "Evento_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Utente" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PraticaSIAE" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "eventoId" TEXT NOT NULL,
    "tipoPermesso" TEXT NOT NULL,
    "dataInvio" DATETIME,
    "protocollo" TEXT,
    "minimoGarantito" DECIMAL,
    "importoPagato" DECIMAL,
    "conguaglio" DECIMAL,
    "borderoAllegatoId" TEXT,
    "stato" TEXT NOT NULL DEFAULT 'da_predisporre',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PraticaSIAE_eventoId_fkey" FOREIGN KEY ("eventoId") REFERENCES "Evento" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BranoMusicale" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "titolo" TEXT NOT NULL,
    "autore" TEXT NOT NULL,
    "editore" TEXT,
    "durataSecondi" INTEGER,
    "deletedAt" DATETIME
);

-- CreateTable
CREATE TABLE "ProgrammaMusicalePratica" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "praticaId" TEXT NOT NULL,
    "branoId" TEXT NOT NULL,
    "ordineEsecuzione" INTEGER,
    "note" TEXT,
    CONSTRAINT "ProgrammaMusicalePratica_praticaId_fkey" FOREIGN KEY ("praticaId") REFERENCES "PraticaSIAE" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ProgrammaMusicalePratica_branoId_fkey" FOREIGN KEY ("branoId") REFERENCES "BranoMusicale" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PartecipazioneEvento" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "eventoId" TEXT NOT NULL,
    "personaId" TEXT,
    "nomeLibero" TEXT,
    "bigliettoOblazione" DECIMAL,
    "checkInQr" BOOLEAN NOT NULL DEFAULT false,
    "dataCheckIn" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PartecipazioneEvento_eventoId_fkey" FOREIGN KEY ("eventoId") REFERENCES "Evento" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PartecipazioneEvento_personaId_fkey" FOREIGN KEY ("personaId") REFERENCES "Persona" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TurnoVolontario" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "eventoId" TEXT NOT NULL,
    "volontarioId" TEXT NOT NULL,
    "mansione" TEXT NOT NULL,
    "oraInizio" TEXT,
    "oraFine" TEXT,
    "stato" TEXT NOT NULL DEFAULT 'proposto',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TurnoVolontario_eventoId_fkey" FOREIGN KEY ("eventoId") REFERENCES "Evento" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "TurnoVolontario_volontarioId_fkey" FOREIGN KEY ("volontarioId") REFERENCES "Persona" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SponsorContributo" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "soggettoId" TEXT,
    "soggettoLibero" TEXT,
    "tipo" TEXT NOT NULL,
    "importo" DECIMAL NOT NULL,
    "data" DATETIME NOT NULL,
    "eventoId" TEXT,
    "raccoltaFondiId" TEXT,
    "stato" TEXT NOT NULL DEFAULT 'richiesto',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "createdById" TEXT,
    "deletedAt" DATETIME,
    CONSTRAINT "SponsorContributo_soggettoId_fkey" FOREIGN KEY ("soggettoId") REFERENCES "Persona" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "SponsorContributo_eventoId_fkey" FOREIGN KEY ("eventoId") REFERENCES "Evento" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "SponsorContributo_raccoltaFondiId_fkey" FOREIGN KEY ("raccoltaFondiId") REFERENCES "RaccoltaFondi" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "SponsorContributo_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Utente" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RaccoltaFondi" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "denominazione" TEXT NOT NULL,
    "periodoInizio" DATETIME NOT NULL,
    "periodoFine" DATETIME,
    "eventoId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME,
    CONSTRAINT "RaccoltaFondi_eventoId_fkey" FOREIGN KEY ("eventoId") REFERENCES "Evento" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Riunione" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tipo" TEXT NOT NULL,
    "data" DATETIME NOT NULL,
    "ora" TEXT,
    "sede" TEXT,
    "ordineDelGiorno" TEXT NOT NULL,
    "quorumCostitutivoVerificato" BOOLEAN,
    "quorumDeliberativoVerificato" BOOLEAN,
    "numeroProgressivo" INTEGER NOT NULL,
    "verbaleTesto" TEXT,
    "verbalePdfAllegatoId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "createdById" TEXT,
    "deletedAt" DATETIME,
    CONSTRAINT "Riunione_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Utente" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RiunionePartecipante" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "riunioneId" TEXT NOT NULL,
    "personaId" TEXT NOT NULL,
    "convocato" BOOLEAN NOT NULL DEFAULT true,
    "presente" BOOLEAN NOT NULL DEFAULT false,
    "delegatoDaId" TEXT,
    CONSTRAINT "RiunionePartecipante_riunioneId_fkey" FOREIGN KEY ("riunioneId") REFERENCES "Riunione" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "RiunionePartecipante_personaId_fkey" FOREIGN KEY ("personaId") REFERENCES "Persona" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "RiunionePartecipante_delegatoDaId_fkey" FOREIGN KEY ("delegatoDaId") REFERENCES "Persona" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Delibera" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "riunioneId" TEXT NOT NULL,
    "oggetto" TEXT NOT NULL,
    "esito" TEXT NOT NULL,
    "votiFavorevoli" INTEGER,
    "votiContrari" INTEGER,
    "votiAstenuti" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Delibera_riunioneId_fkey" FOREIGN KEY ("riunioneId") REFERENCES "Riunione" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Protocollo" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "numero" INTEGER NOT NULL,
    "annoRiferimento" INTEGER NOT NULL,
    "tipo" TEXT NOT NULL,
    "data" DATETIME NOT NULL,
    "mittenteDestinatario" TEXT NOT NULL,
    "oggetto" TEXT NOT NULL,
    "mezzo" TEXT NOT NULL,
    "allegatoId" TEXT,
    "classificazione" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT,
    CONSTRAINT "Protocollo_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Utente" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Documento" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "titolo" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "allegatoId" TEXT NOT NULL,
    "scadenza" DATETIME,
    "versione" INTEGER NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "createdById" TEXT,
    "deletedAt" DATETIME,
    CONSTRAINT "Documento_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Utente" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Comunicazione" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "titolo" TEXT NOT NULL,
    "segmento" TEXT NOT NULL,
    "segmentoParametri" TEXT,
    "templateOggetto" TEXT NOT NULL,
    "templateCorpo" TEXT NOT NULL,
    "stato" TEXT NOT NULL DEFAULT 'bozza',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "createdById" TEXT,
    "deletedAt" DATETIME,
    CONSTRAINT "Comunicazione_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Utente" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ComunicazioneInvio" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "comunicazioneId" TEXT NOT NULL,
    "personaId" TEXT NOT NULL,
    "emailDestinatario" TEXT NOT NULL,
    "stato" TEXT NOT NULL DEFAULT 'in_coda',
    "dataInvio" DATETIME,
    "erroreMessaggio" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ComunicazioneInvio_comunicazioneId_fkey" FOREIGN KEY ("comunicazioneId") REFERENCES "Comunicazione" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ComunicazioneInvio_personaId_fkey" FOREIGN KEY ("personaId") REFERENCES "Persona" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Informativa" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "versione" TEXT NOT NULL,
    "testo" TEXT NOT NULL,
    "dataPubblicazione" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Consenso" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "personaId" TEXT NOT NULL,
    "informativaId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "stato" TEXT NOT NULL,
    "data" DATETIME NOT NULL,
    "modalita" TEXT NOT NULL,
    "ipRichiesta" TEXT,
    "canaliAutorizzatiImmagini" TEXT,
    "firmatoDaGenitoreId" TEXT,
    "allegatoLiberatoriaId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Consenso_personaId_fkey" FOREIGN KEY ("personaId") REFERENCES "Persona" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Consenso_informativaId_fkey" FOREIGN KEY ("informativaId") REFERENCES "Informativa" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Consenso_firmatoDaGenitoreId_fkey" FOREIGN KEY ("firmatoDaGenitoreId") REFERENCES "Persona" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RegistroTrattamenti" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nomeTrattamento" TEXT NOT NULL,
    "finalita" TEXT NOT NULL,
    "baseGiuridica" TEXT NOT NULL,
    "categorieDati" TEXT NOT NULL,
    "categorieInteressati" TEXT NOT NULL,
    "destinatari" TEXT,
    "tempiConservazione" TEXT NOT NULL,
    "misureSicurezza" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "utenteId" TEXT,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "entita" TEXT NOT NULL,
    "entitaId" TEXT NOT NULL,
    "azione" TEXT NOT NULL,
    "diffJson" TEXT,
    "ip" TEXT,
    CONSTRAINT "AuditLog_utenteId_fkey" FOREIGN KEY ("utenteId") REFERENCES "Utente" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RichiestaInteressato" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "personaId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "dataRichiesta" DATETIME NOT NULL,
    "esito" TEXT,
    "dataEvasione" DATETIME,
    "exportAllegatoId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "RichiestaInteressato_personaId_fkey" FOREIGN KEY ("personaId") REFERENCES "Persona" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Allegato" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "entitaTipo" TEXT NOT NULL,
    "entitaId" TEXT NOT NULL,
    "nomeFile" TEXT NOT NULL,
    "nomeFileOriginale" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "dimensioneByte" INTEGER NOT NULL,
    "percorso" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT,
    "deletedAt" DATETIME,
    CONSTRAINT "Allegato_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Utente" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "AnnoSociale_etichetta_key" ON "AnnoSociale"("etichetta");

-- CreateIndex
CREATE INDEX "AnnoSociale_dataInizio_dataFine_idx" ON "AnnoSociale"("dataInizio", "dataFine");

-- CreateIndex
CREATE INDEX "CaricaSociale_personaId_idx" ON "CaricaSociale"("personaId");

-- CreateIndex
CREATE INDEX "CaricaSociale_ruolo_idx" ON "CaricaSociale"("ruolo");

-- CreateIndex
CREATE UNIQUE INDEX "Utente_personaId_key" ON "Utente"("personaId");

-- CreateIndex
CREATE UNIQUE INDEX "Utente_email_key" ON "Utente"("email");

-- CreateIndex
CREATE INDEX "Utente_email_idx" ON "Utente"("email");

-- CreateIndex
CREATE INDEX "Sessione_utenteId_idx" ON "Sessione"("utenteId");

-- CreateIndex
CREATE INDEX "Sessione_scadenza_idx" ON "Sessione"("scadenza");

-- CreateIndex
CREATE UNIQUE INDEX "Numeratore_entita_annoRiferimento_key" ON "Numeratore"("entita", "annoRiferimento");

-- CreateIndex
CREATE UNIQUE INDEX "Persona_codiceFiscale_key" ON "Persona"("codiceFiscale");

-- CreateIndex
CREATE INDEX "Persona_cognome_nome_idx" ON "Persona"("cognome", "nome");

-- CreateIndex
CREATE INDEX "Persona_codiceFiscale_idx" ON "Persona"("codiceFiscale");

-- CreateIndex
CREATE INDEX "RelazioneFamiliare_minoreId_idx" ON "RelazioneFamiliare"("minoreId");

-- CreateIndex
CREATE INDEX "RuoloPersona_personaId_tipo_idx" ON "RuoloPersona"("personaId", "tipo");

-- CreateIndex
CREATE UNIQUE INDEX "Socio_personaId_key" ON "Socio"("personaId");

-- CreateIndex
CREATE UNIQUE INDEX "Socio_numeroLibroSoci_key" ON "Socio"("numeroLibroSoci");

-- CreateIndex
CREATE INDEX "Socio_numeroLibroSoci_idx" ON "Socio"("numeroLibroSoci");

-- CreateIndex
CREATE INDEX "SocioStato_socioId_dataInizio_idx" ON "SocioStato"("socioId", "dataInizio");

-- CreateIndex
CREATE UNIQUE INDEX "Tesseramento_numeroTessera_key" ON "Tesseramento"("numeroTessera");

-- CreateIndex
CREATE UNIQUE INDEX "Tesseramento_quotaId_key" ON "Tesseramento"("quotaId");

-- CreateIndex
CREATE UNIQUE INDEX "Tesseramento_qrToken_key" ON "Tesseramento"("qrToken");

-- CreateIndex
CREATE INDEX "Tesseramento_numeroTessera_idx" ON "Tesseramento"("numeroTessera");

-- CreateIndex
CREATE UNIQUE INDEX "Tesseramento_socioId_annoSocialeId_key" ON "Tesseramento"("socioId", "annoSocialeId");

-- CreateIndex
CREATE INDEX "TipoQuota_annoSocialeId_idx" ON "TipoQuota"("annoSocialeId");

-- CreateIndex
CREATE UNIQUE INDEX "Quota_iscrizioneCorsoId_key" ON "Quota"("iscrizioneCorsoId");

-- CreateIndex
CREATE UNIQUE INDEX "Quota_iscrizioneEventoId_key" ON "Quota"("iscrizioneEventoId");

-- CreateIndex
CREATE INDEX "Quota_personaId_stato_idx" ON "Quota"("personaId", "stato");

-- CreateIndex
CREATE INDEX "Quota_annoSocialeId_idx" ON "Quota"("annoSocialeId");

-- CreateIndex
CREATE UNIQUE INDEX "SaldoContoAnno_contoId_annoSocialeId_key" ON "SaldoContoAnno"("contoId", "annoSocialeId");

-- CreateIndex
CREATE INDEX "Pagamento_data_idx" ON "Pagamento"("data");

-- CreateIndex
CREATE UNIQUE INDEX "MovimentoPrimaNota_pagamentoId_key" ON "MovimentoPrimaNota"("pagamentoId");

-- CreateIndex
CREATE UNIQUE INDEX "MovimentoPrimaNota_ricevutaId_key" ON "MovimentoPrimaNota"("ricevutaId");

-- CreateIndex
CREATE UNIQUE INDEX "MovimentoPrimaNota_stornoDiId_key" ON "MovimentoPrimaNota"("stornoDiId");

-- CreateIndex
CREATE INDEX "MovimentoPrimaNota_data_idx" ON "MovimentoPrimaNota"("data");

-- CreateIndex
CREATE INDEX "MovimentoPrimaNota_contoId_data_idx" ON "MovimentoPrimaNota"("contoId", "data");

-- CreateIndex
CREATE INDEX "MovimentoPrimaNota_categoriaRendiconto_idx" ON "MovimentoPrimaNota"("categoriaRendiconto");

-- CreateIndex
CREATE UNIQUE INDEX "Ricevuta_pagamentoId_key" ON "Ricevuta"("pagamentoId");

-- CreateIndex
CREATE INDEX "Ricevuta_intestatarioId_idx" ON "Ricevuta"("intestatarioId");

-- CreateIndex
CREATE UNIQUE INDEX "Ricevuta_numero_annoSolare_key" ON "Ricevuta"("numero", "annoSolare");

-- CreateIndex
CREATE INDEX "Scadenza_dataScadenza_completata_idx" ON "Scadenza"("dataScadenza", "completata");

-- CreateIndex
CREATE INDEX "Corso_stato_idx" ON "Corso"("stato");

-- CreateIndex
CREATE UNIQUE INDEX "CorsoDocente_corsoId_personaId_key" ON "CorsoDocente"("corsoId", "personaId");

-- CreateIndex
CREATE UNIQUE INDEX "Modulo_corsoId_numero_key" ON "Modulo"("corsoId", "numero");

-- CreateIndex
CREATE INDEX "Lezione_data_idx" ON "Lezione"("data");

-- CreateIndex
CREATE UNIQUE INDEX "Lezione_corsoId_numeroProgressivo_key" ON "Lezione"("corsoId", "numeroProgressivo");

-- CreateIndex
CREATE INDEX "IscrizioneCorso_corsoId_stato_idx" ON "IscrizioneCorso"("corsoId", "stato");

-- CreateIndex
CREATE UNIQUE INDEX "IscrizioneCorso_personaId_corsoId_key" ON "IscrizioneCorso"("personaId", "corsoId");

-- CreateIndex
CREATE UNIQUE INDEX "Presenza_lezioneId_iscrizioneId_key" ON "Presenza"("lezioneId", "iscrizioneId");

-- CreateIndex
CREATE UNIQUE INDEX "Attestato_iscrizioneId_key" ON "Attestato"("iscrizioneId");

-- CreateIndex
CREATE UNIQUE INDEX "Attestato_numeroProgressivo_key" ON "Attestato"("numeroProgressivo");

-- CreateIndex
CREATE UNIQUE INDEX "DomandaQuestionario_questionarioId_ordine_key" ON "DomandaQuestionario"("questionarioId", "ordine");

-- CreateIndex
CREATE UNIQUE INDEX "RispostaQuestionario_tokenPersonale_key" ON "RispostaQuestionario"("tokenPersonale");

-- CreateIndex
CREATE UNIQUE INDEX "RispostaQuestionario_questionarioId_iscrizioneId_key" ON "RispostaQuestionario"("questionarioId", "iscrizioneId");

-- CreateIndex
CREATE UNIQUE INDEX "RispostaDomanda_rispostaQuestionarioId_domandaId_key" ON "RispostaDomanda"("rispostaQuestionarioId", "domandaId");

-- CreateIndex
CREATE INDEX "Evento_stato_dataInizio_idx" ON "Evento"("stato", "dataInizio");

-- CreateIndex
CREATE UNIQUE INDEX "PraticaSIAE_eventoId_key" ON "PraticaSIAE"("eventoId");

-- CreateIndex
CREATE UNIQUE INDEX "ProgrammaMusicalePratica_praticaId_branoId_key" ON "ProgrammaMusicalePratica"("praticaId", "branoId");

-- CreateIndex
CREATE INDEX "PartecipazioneEvento_eventoId_idx" ON "PartecipazioneEvento"("eventoId");

-- CreateIndex
CREATE INDEX "TurnoVolontario_eventoId_idx" ON "TurnoVolontario"("eventoId");

-- CreateIndex
CREATE INDEX "Riunione_data_idx" ON "Riunione"("data");

-- CreateIndex
CREATE UNIQUE INDEX "Riunione_tipo_numeroProgressivo_key" ON "Riunione"("tipo", "numeroProgressivo");

-- CreateIndex
CREATE UNIQUE INDEX "RiunionePartecipante_riunioneId_personaId_key" ON "RiunionePartecipante"("riunioneId", "personaId");

-- CreateIndex
CREATE UNIQUE INDEX "Protocollo_tipo_numero_annoRiferimento_key" ON "Protocollo"("tipo", "numero", "annoRiferimento");

-- CreateIndex
CREATE INDEX "Documento_categoria_idx" ON "Documento"("categoria");

-- CreateIndex
CREATE INDEX "Documento_scadenza_idx" ON "Documento"("scadenza");

-- CreateIndex
CREATE INDEX "ComunicazioneInvio_comunicazioneId_stato_idx" ON "ComunicazioneInvio"("comunicazioneId", "stato");

-- CreateIndex
CREATE UNIQUE INDEX "Informativa_versione_key" ON "Informativa"("versione");

-- CreateIndex
CREATE INDEX "Consenso_personaId_tipo_idx" ON "Consenso"("personaId", "tipo");

-- CreateIndex
CREATE INDEX "AuditLog_entita_entitaId_idx" ON "AuditLog"("entita", "entitaId");

-- CreateIndex
CREATE INDEX "AuditLog_timestamp_idx" ON "AuditLog"("timestamp");

-- CreateIndex
CREATE INDEX "RichiestaInteressato_personaId_idx" ON "RichiestaInteressato"("personaId");

-- CreateIndex
CREATE INDEX "Allegato_entitaTipo_entitaId_idx" ON "Allegato"("entitaTipo", "entitaId");
