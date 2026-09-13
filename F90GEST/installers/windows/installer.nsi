; Installer Windows per F90GEST.
; Non richiede diritti di amministratore: installa tutto (runtime Node.js
; portatile incluso, codice applicazione, database e allegati) sotto il
; profilo dell'utente corrente (%LOCALAPPDATA%). Durante l'installazione
; scarica le dipendenze npm e compila l'applicazione: richiede una
; connessione a internet attiva e puo' richiedere alcuni minuti.

!include "LogicLib.nsh"
!include "MUI2.nsh"

!define APP_NAME "F90GEST"
!define APP_VERSION "1.0.0"
!define APP_PUBLISHER "Associazione Culturale Frequenze 90"

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
  DetailPrint "Copio il runtime Node.js..."
  SetOutPath "$INSTDIR\node"
  File /r "node\*.*"

  DetailPrint "Copio i file dell'applicazione..."
  SetOutPath "$INSTDIR\app"
  File /r "app\*.*"

  SetOutPath "$INSTDIR"
  File "Avvia F90GEST.bat"
  File "Ferma F90GEST.bat"

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
