@echo off
echo Arresto di F90GEST in corso...
set TROVATO=0
rem ":3000 " con lo spazio finale evita di intercettare per errore la
rem porta 30001, 30002, ecc. (findstr fa un confronto per sottostringa).
for /f "tokens=5" %%p in ('netstat -ano ^| findstr /R /C:":3000 " ^| findstr LISTENING') do (
    taskkill /F /PID %%p >nul 2>&1
    set TROVATO=1
)
if "%TROVATO%"=="1" (
    echo F90GEST arrestato.
) else (
    echo F90GEST non risultava in esecuzione.
)
pause
