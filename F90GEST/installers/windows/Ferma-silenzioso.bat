@echo off
rem Stessa logica di "Ferma F90GEST.bat" ma senza messaggi ne' "pause":
rem richiamato dall'aggiornamento (NSIS, nsExec), che si aspetta un
rem comando che termina da solo senza attendere un invio da tastiera.
for /f "tokens=5" %%p in ('netstat -ano ^| findstr /R /C:":3000 " ^| findstr LISTENING') do (
    taskkill /F /PID %%p >nul 2>&1
)
exit /b 0
