@echo off
setlocal
set "ROOT=%~dp0"
set "NODE_DIR=%ROOT%node"
set "APP_DIR=%ROOT%app"

echo ============================================================
echo   AZZERAMENTO COMPLETO DEI DATI DI F90GEST
echo ============================================================
echo.
echo Questo comando CANCELLA TUTTI i dati del gestionale: soci,
echo contabilita', ricevute, corsi, documenti, email configurate,
echo tutto. L'applicazione torna allo stato di "primo avvio", con
echo l'utente amministratore predefinito:
echo     email:    admin@example.org
echo     password: CambiaSubito!2026
echo.
echo Prima di procedere viene creato un backup di sicurezza dei dati
echo attuali in un file .zip accanto a questo script, cosi' puoi
echo recuperarli se ti accorgi di aver sbagliato. Questo backup NON
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
    echo Nessuna installazione di F90GEST trovata in questa cartella.
    echo Esegui prima F90GEST-Setup-Windows.exe.
    pause
    exit /b 1
)

echo.
echo Fermo F90GEST se risulta in esecuzione...
for /f "tokens=5" %%p in ('netstat -ano ^| findstr /R /C:":3000 " ^| findstr LISTENING') do (
    taskkill /F /PID %%p >nul 2>&1
)

echo.
echo Creo un backup di sicurezza prima di azzerare i dati...
for /f "delims=" %%t in ('powershell -NoProfile -Command "Get-Date -Format yyyyMMdd-HHmmss"') do set "TIMESTAMP=%%t"
set "BACKUP_ZIP=%ROOT%Backup-prima-di-azzeramento-%TIMESTAMP%.zip"
powershell -NoProfile -ExecutionPolicy Bypass -Command "$percorsi = @('%APP_DIR%\prisma\data', '%APP_DIR%\storage') | Where-Object { Test-Path $_ }; if ($percorsi.Count -eq 0) { Write-Host 'Nessun dato esistente da salvare (prima esecuzione?).'; exit 0 }; Compress-Archive -Path $percorsi -DestinationPath '%BACKUP_ZIP%' -Force"
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERRORE: non sono riuscito a creare il backup di sicurezza.
    echo Per precauzione mi fermo QUI, senza azzerare nulla.
    echo Se il problema persiste, contattami per sistemarlo.
    pause
    exit /b 1
)
if exist "%BACKUP_ZIP%" (
    echo Backup di sicurezza salvato in: %BACKUP_ZIP%
)

echo.
echo Azzero il database (vengono ricreati utente amministratore e dati minimi)...
cd /d "%APP_DIR%"
"%NODE_DIR%\node.exe" "%NODE_DIR%\node_modules\npm\bin\npx-cli.js" prisma migrate reset --force
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERRORE durante l'azzeramento del database (codice %ERRORLEVEL%).
    echo I dati originali restano comunque nel backup di sicurezza sopra indicato.
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
