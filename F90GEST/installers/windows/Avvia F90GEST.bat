@echo off
setlocal
set "ROOT=%~dp0"
set "NODE_DIR=%ROOT%node"
set "APP_DIR=%ROOT%app"

rem Se il server risponde gia' su localhost:3000, apri solo il browser.
powershell -NoProfile -Command "try { $c = New-Object Net.Sockets.TcpClient; $c.Connect('127.0.0.1',3000); $c.Close(); exit 0 } catch { exit 1 }" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    start "" "http://localhost:3000"
    exit /b 0
)

echo Avvio F90GEST in corso, attendere...
cd /d "%APP_DIR%"
start "F90GEST - non chiudere questa finestra" /min "%NODE_DIR%\node.exe" "%NODE_DIR%\node_modules\npm\bin\npm-cli.js" run start

set TENTATIVI=0
:attesa
timeout /t 1 /nobreak >nul
powershell -NoProfile -Command "try { $c = New-Object Net.Sockets.TcpClient; $c.Connect('127.0.0.1',3000); $c.Close(); exit 0 } catch { exit 1 }" >nul 2>&1
if %ERRORLEVEL% EQU 0 goto avviato
set /a TENTATIVI+=1
if %TENTATIVI% LSS 45 goto attesa

echo.
echo F90GEST non ha risposto entro 45 secondi.
echo Controlla la finestra "F90GEST - non chiudere questa finestra" per eventuali errori.
pause
exit /b 1

:avviato
start "" "http://localhost:3000"
exit /b 0
