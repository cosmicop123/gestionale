; Aggiornamento di F90GEST su un'installazione gia' esistente (creata con
; F90GEST-Setup-Windows.exe). A differenza dell'installer completo:
; - non scarica il runtime Node.js (riusa quello gia' presente in
;   $INSTDIR\node), che e' il passaggio piu' lento e pesante dell'installazione
;   completa e non cambia da una versione all'altra dell'app;
; - non richiede una cartella di destinazione "pulita": si aspetta di
;   trovare un'installazione esistente e si ferma con un errore chiaro se
;   non la trova;
; - non tocca mai il database o gli allegati (prisma\data, storage): sono
;   fuori dall'archivio del codice copiato da questo eseguibile, esattamente
;   come gia' avviene per l'installer completo.
; Pensato per essere molto piu' veloce (niente download del runtime, niente
; scelta guidata della cartella) delle versioni successive alla prima.

!include "LogicLib.nsh"
!include "MUI2.nsh"

!define APP_NAME "F90GEST"

Name "${APP_NAME} - Aggiornamento"
OutFile "F90GEST-Aggiornamento-Windows.exe"
InstallDir "$LOCALAPPDATA\${APP_NAME}"
RequestExecutionLevel user
Unicode true
ShowInstDetails show

!define MUI_ABORTWARNING
!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH
!insertmacro MUI_LANGUAGE "Italian"

Function .onInit
  ; Stesso mutex dell'installer completo: impedisce che installazione e
  ; aggiornamento (o due aggiornamenti) girino insieme sulla stessa cartella.
  System::Call 'kernel32::CreateMutexA(i 0, i 0, t "F90GESTSetupMutex") i .r1 ?e'
  Pop $R0
  StrCmp $R0 0 +3
    MessageBox MB_OK|MB_ICONEXCLAMATION "Un'altra installazione o aggiornamento di F90GEST e' gia' in corso."
    Abort
FunctionEnd

Section "Aggiorna F90GEST" SEC01
  IfFileExists "$INSTDIR\node\node.exe" installazioneTrovata nessunaInstallazione
  nessunaInstallazione:
    MessageBox MB_OK|MB_ICONSTOP "Nessuna installazione di F90GEST trovata in questa cartella.$\r$\nEsegui prima F90GEST-Setup-Windows.exe (installazione completa): questo programma serve solo per aggiornare un'installazione gia' esistente."
    Abort
  installazioneTrovata:

  DetailPrint "Fermo F90GEST se risulta in esecuzione..."
  SetOutPath "$INSTDIR"
  File "Ferma-silenzioso.bat"
  nsExec::ExecToLog '"$INSTDIR\Ferma-silenzioso.bat"'

  DetailPrint "Copio i file dell'applicazione aggiornati..."
  SetOutPath "$INSTDIR\app"
  File /r "app\*.*"

  SetOutPath "$INSTDIR"
  File "Avvia F90GEST.bat"
  File "Ferma F90GEST.bat"

  DetailPrint "Completo la configurazione (.env) con eventuali nuove variabili introdotte..."
  nsExec::ExecToLog '"$INSTDIR\node\node.exe" "$INSTDIR\app\scripts\genera-env.js"'
  Pop $0
  ${If} $0 != 0
    MessageBox MB_OK|MB_ICONSTOP "Impossibile completare il file di configurazione (.env). Codice errore: $0."
    Abort
  ${EndIf}

  DetailPrint "Aggiorno le dipendenze dell'applicazione: puo' richiedere qualche minuto, serve una connessione a internet..."
  SetOutPath "$INSTDIR\app"
  nsExec::ExecToLog '"$INSTDIR\node\node.exe" "$INSTDIR\node\node_modules\npm\bin\npm-cli.js" ci --legacy-peer-deps --no-audit --no-fund'
  Pop $0
  ${If} $0 != 0
    MessageBox MB_OK|MB_ICONSTOP "Aggiornamento delle dipendenze non riuscito (codice $0).$\r$\nVerifica la connessione a internet e riprova."
    Abort
  ${EndIf}

  DetailPrint "Applico le eventuali nuove migrazioni del database (i tuoi dati non vengono toccati)..."
  nsExec::ExecToLog '"$INSTDIR\node\node.exe" "$INSTDIR\node\node_modules\npm\bin\npx-cli.js" prisma migrate deploy'
  Pop $0
  ${If} $0 != 0
    MessageBox MB_OK|MB_ICONSTOP "Aggiornamento del database non riuscito (codice $0)."
    Abort
  ${EndIf}

  nsExec::ExecToLog '"$INSTDIR\node\node.exe" "$INSTDIR\node\node_modules\npm\bin\npx-cli.js" prisma db seed'

  DetailPrint "Ricompilo l'applicazione: puo' richiedere qualche minuto..."
  nsExec::ExecToLog '"$INSTDIR\node\node.exe" "$INSTDIR\node\node_modules\npm\bin\npm-cli.js" run build'
  Pop $0
  ${If} $0 != 0
    MessageBox MB_OK|MB_ICONSTOP "Compilazione dell'applicazione non riuscita (codice $0)."
    Abort
  ${EndIf}

  DetailPrint "Aggiornamento completato. Avvio F90GEST..."
  Exec '"$INSTDIR\Avvia F90GEST.bat"'
SectionEnd
