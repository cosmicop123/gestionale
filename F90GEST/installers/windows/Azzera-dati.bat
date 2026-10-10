@echo off
setlocal
set "ROOT=%~dp0"
set "NODE_DIR=%ROOT%node"
set "APP_DIR=%ROOT%app"

echo ============================================================
echo   AZZERAMENTO COMPLETO DEI DATI DI F90GEST
echo ============================================================
echo.
echo Cartella rilevata: %ROOT%
echo.
echo Questo comando CANCELLA TUTTI i dati del gestionale: soci,
echo contabilita', ricevute, corsi, documenti, email configurate,
echo tutto. L'applicazione torna allo stato di "primo avvio", con
echo l'utente amministratore predefinito:
echo     email:    admin@example.org
echo     password: CambiaSubito!2026
echo.
echo Prima di procedere viene creata una copia di sicurezza dei dati
echo attuali in una cartella accanto a questo script, cosi' puoi
echo recuperarli se ti accorgi di aver sbagliato. Questa copia NON
echo sostituisce un backup fatto da te prima d'ora: se i dati attuali
echo sono importanti, assicurati di averne gia' una copia altrove
echo (es. Amministrazione - Backup e ripristino, dentro l'app).
echo.
set /p CONFERMA="Per procedere, digita ESATTAMENTE AZZERA e premi Invio: "
if not "%CONFERMA%"=="AZZERA" (
    echo.
    echo Annullato: nessun dato e' stato modificato.
    pause
    exit /b 1
)

if not exist "%NODE_DIR%\node.exe" (
    echo.
    echo Nessuna installazione di F90GEST trovata in questa cartella
    echo ^(%ROOT%^).
    echo Esegui prima F90GEST-Setup-Windows.exe, oppure sposta questo
    echo file dentro la cartella dove hai installato F90GEST e riprova.
    pause
    exit /b 1
)

echo.
echo Fermo F90GEST se risulta in esecuzione...
for /f "tokens=5" %%p in ('netstat -ano ^| findstr /R /C:":3000 " ^| findstr LISTENING') do (
    taskkill /F /PID %%p >nul 2>&1
)

echo.
echo Creo una copia di sicurezza prima di azzerare i dati...
set "BACKUP_DIR=%ROOT%Backup-prima-di-azzeramento"
if exist "%BACKUP_DIR%" (
    if exist "%BACKUP_DIR%-precedente" rmdir /s /q "%BACKUP_DIR%-precedente"
    move "%BACKUP_DIR%" "%BACKUP_DIR%-precedente" >nul
    echo ^(La copia di sicurezza del tentativo precedente e' stata conservata in:
    echo  %BACKUP_DIR%-precedente^)
)
mkdir "%BACKUP_DIR%" 2>nul

set BACKUP_OK=1
if exist "%APP_DIR%\prisma\data" (
    robocopy "%APP_DIR%\prisma\data" "%BACKUP_DIR%\prisma\data" /e >nul
    if errorlevel 8 set BACKUP_OK=0
)
if exist "%APP_DIR%\storage" (
    robocopy "%APP_DIR%\storage" "%BACKUP_DIR%\storage" /e >nul
    if errorlevel 8 set BACKUP_OK=0
)

if "%BACKUP_OK%"=="0" (
    echo.
    echo ERRORE: non sono riuscito a completare la copia di sicurezza in
    echo %BACKUP_DIR%
    echo Per precauzione mi fermo QUI, senza azzerare nulla.
    echo Se il problema persiste, contattami riportando questo messaggio.
    pause
    exit /b 1
)
echo Copia di sicurezza salvata in: %BACKUP_DIR%

echo.
echo Azzero il database (vengono ricreati utente amministratore e dati minimi)...
cd /d "%APP_DIR%"
"%NODE_DIR%\node.exe" "%NODE_DIR%\node_modules\npm\bin\npx-cli.js" prisma migrate reset --force
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERRORE durante l'azzeramento del database ^(codice %ERRORLEVEL%^).
    echo I dati originali restano comunque nella copia di sicurezza sopra indicata.
    pause
    exit /b 1
)

echo.
echo Svuoto gli allegati caricati (documenti, ricevute, foto)...
if exist "%APP_DIR%\storage" (
    rmdir /s /q "%APP_DIR%\storage"
)
mkdir "%APP_DIR%\storage"

echo.
echo ============================================================
echo   AZZERAMENTO COMPLETATO
echo ============================================================
echo Il gestionale e' tornato allo stato di primo avvio.
echo Riapri F90GEST (icona sul Desktop) per ricominciare dal wizard
echo di configurazione iniziale.
echo.
pause
