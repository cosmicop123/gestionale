; Installer Windows per F90GEST.
; Non richiede diritti di amministratore: installa tutto (runtime Node.js,
; codice applicazione, database e allegati) sotto il profilo dell'utente
; corrente (%LOCALAPPDATA%). Il runtime Node.js NON e' incluso in questo
; file (terrebbe l'installer sopra i limiti di trasferimento usati per
; consegnarlo): viene scaricato dal sito ufficiale nodejs.org al momento
; dell'installazione, con lo stesso meccanismo (PowerShell) gia' presente
; su qualunque Windows 10/11. Richiede quindi una connessione a internet
; attiva per l'intera durata dell'installazione (alcuni minuti).

!include "LogicLib.nsh"
!include "MUI2.nsh"

!define APP_NAME "F90GEST"
!define APP_VERSION "1.0.0"
!define APP_PUBLISHER "Associazione Culturale Frequenze 90"
!define NODE_VERSION "22.23.2"
!define NODE_URL "https://nodejs.org/dist/v${NODE_VERSION}/node-v${NODE_VERSION}-win-x64.zip"

Name "${APP_NAME}"
OutFile "F90GEST-Setup-Windows.exe"
InstallDir "$LOCALAPPDATA\${APP_NAME}"
RequestExecutionLevel user
Unicode true
ShowInstDetails show
ShowUninstDetails show

!define MUI_ABORTWARNING
!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH
!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES
!insertmacro MUI_LANGUAGE "Italian"

Function .onInit
  ; Impedisce due installazioni/avvii concorrenti che scriverebbero sullo
  ; stesso database contemporaneamente durante il setup.
  System::Call 'kernel32::CreateMutexA(i 0, i 0, t "F90GESTSetupMutex") i .r1 ?e'
  Pop $R0
  StrCmp $R0 0 +3
    MessageBox MB_OK|MB_ICONEXCLAMATION "Un'altra installazione di F90GEST e' gia' in corso."
    Abort
FunctionEnd

Section "Installa F90GEST" SEC01
  DetailPrint "Copio i file dell'applicazione..."
  SetOutPath "$INSTDIR\app"
  File /r "app\*.*"

  SetOutPath "$INSTDIR"
  File "Avvia F90GEST.bat"
  File "Ferma F90GEST.bat"

  DetailPrint "Scarico il runtime Node.js v${NODE_VERSION} da nodejs.org: puo' richiedere qualche minuto..."
  ; [Net.ServicePointManager]::SecurityProtocol forza TLS 1.2: alcune
  ; installazioni di Windows 10 hanno ancora TLS 1.0 come default per
  ; .NET/PowerShell, che nodejs.org rifiuta, e il download fallirebbe in
  ; silenzio senza questa riga.
  nsExec::ExecToLog 'powershell -NoProfile -ExecutionPolicy Bypass -Command "[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -Uri $\'${NODE_URL}$\' -OutFile $\'$INSTDIR\node.zip$\'"'
  Pop $0
  ${If} $0 != 0
    MessageBox MB_OK|MB_ICONSTOP "Download del runtime Node.js non riuscito (codice $0).$\r$\nVerifica la connessione a internet e riprova l'installazione."
    Abort
  ${EndIf}

  DetailPrint "Estraggo il runtime Node.js..."
  nsExec::ExecToLog 'powershell -NoProfile -ExecutionPolicy Bypass -Command "Expand-Archive -Path $\'$INSTDIR\node.zip$\' -DestinationPath $\'$INSTDIR\node-tmp$\' -Force"'
  Pop $0
  ${If} $0 != 0
    MessageBox MB_OK|MB_ICONSTOP "Estrazione del runtime Node.js non riuscita (codice $0)."
    Abort
  ${EndIf}
  Rename "$INSTDIR\node-tmp\node-v${NODE_VERSION}-win-x64" "$INSTDIR\node"
  RMDir "$INSTDIR\node-tmp"
  Delete "$INSTDIR\node.zip"

  DetailPrint "Genero la configurazione iniziale (.env)..."
  nsExec::ExecToLog '"$INSTDIR\node\node.exe" "$INSTDIR\app\scripts\genera-env.js"'
  Pop $0
  ${If} $0 != 0
    MessageBox MB_OK|MB_ICONSTOP "Impossibile generare il file di configurazione (.env). Codice errore: $0."
    Abort
  ${EndIf}

  DetailPrint "Scarico e installo le dipendenze dell'applicazione: puo' richiedere alcuni minuti, serve una connessione a internet..."
  SetOutPath "$INSTDIR\app"
  nsExec::ExecToLog '"$INSTDIR\node\node.exe" "$INSTDIR\node\node_modules\npm\bin\npm-cli.js" ci --legacy-peer-deps --no-audit --no-fund'
  Pop $0
  ${If} $0 != 0
    MessageBox MB_OK|MB_ICONSTOP "Installazione delle dipendenze non riuscita (codice $0).$\r$\nVerifica la connessione a internet e riprova l'installazione."
    Abort
  ${EndIf}

  DetailPrint "Preparo il database..."
  nsExec::ExecToLog '"$INSTDIR\node\node.exe" "$INSTDIR\node\node_modules\npm\bin\npx-cli.js" prisma migrate deploy'
  Pop $0
  ${If} $0 != 0
    MessageBox MB_OK|MB_ICONSTOP "Preparazione del database non riuscita (codice $0)."
    Abort
  ${EndIf}

  DetailPrint "Creo i dati minimi (associazione, utente amministratore)..."
  nsExec::ExecToLog '"$INSTDIR\node\node.exe" "$INSTDIR\node\node_modules\npm\bin\npx-cli.js" prisma db seed'
  Pop $0
  ${If} $0 != 0
    MessageBox MB_OK|MB_ICONSTOP "Creazione dei dati minimi non riuscita (codice $0)."
    Abort
  ${EndIf}

  DetailPrint "Compilo l'applicazione: puo' richiedere qualche minuto..."
  nsExec::ExecToLog '"$INSTDIR\node\node.exe" "$INSTDIR\node\node_modules\npm\bin\npm-cli.js" run build'
  Pop $0
  ${If} $0 != 0
    MessageBox MB_OK|MB_ICONSTOP "Compilazione dell'applicazione non riuscita (codice $0)."
    Abort
  ${EndIf}

  CreateDirectory "$SMPROGRAMS\${APP_NAME}"
  CreateShortcut "$SMPROGRAMS\${APP_NAME}\Avvia F90GEST.lnk" "$INSTDIR\Avvia F90GEST.bat" "" "$INSTDIR\Avvia F90GEST.bat" 0
  CreateShortcut "$SMPROGRAMS\${APP_NAME}\Ferma F90GEST.lnk" "$INSTDIR\Ferma F90GEST.bat" "" "$INSTDIR\Ferma F90GEST.bat" 0
  CreateShortcut "$SMPROGRAMS\${APP_NAME}\Disinstalla F90GEST.lnk" "$INSTDIR\Uninstall.exe"
  CreateShortcut "$DESKTOP\F90GEST.lnk" "$INSTDIR\Avvia F90GEST.bat" "" "$INSTDIR\Avvia F90GEST.bat" 0

  WriteUninstaller "$INSTDIR\Uninstall.exe"

  DetailPrint "Installazione completata. Avvio F90GEST..."
  Exec '"$INSTDIR\Avvia F90GEST.bat"'
SectionEnd

Section "Uninstall"
  MessageBox MB_YESNO|MB_ICONQUESTION "Vuoi eliminare anche il database e gli allegati dell'associazione?$\r$\nScegli No se prevedi di reinstallare F90GEST in futuro e vuoi conservare i dati." IDYES rimuoviTutto IDNO conservaDati

  rimuoviTutto:
    RMDir /r "$INSTDIR"
    Goto fine

  conservaDati:
    RMDir /r "$INSTDIR\node"
    RMDir /r "$INSTDIR\app\node_modules"
    RMDir /r "$INSTDIR\app\.next"
    Delete "$INSTDIR\Avvia F90GEST.bat"
    Delete "$INSTDIR\Ferma F90GEST.bat"
    Delete "$INSTDIR\Uninstall.exe"
    MessageBox MB_OK "Database e allegati conservati in:$\r$\n$INSTDIR\app\prisma\data e $INSTDIR\app\storage"

  fine:
  Delete "$SMPROGRAMS\${APP_NAME}\*.lnk"
  RMDir "$SMPROGRAMS\${APP_NAME}"
  Delete "$DESKTOP\F90GEST.lnk"
SectionEnd
