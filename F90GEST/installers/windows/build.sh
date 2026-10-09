#!/bin/sh
# Costruisce gli installer Windows di F90GEST da un ambiente Linux: prende
# uno snapshot pulito del codice dal branch corrente (git archive: rispetta
# .gitignore, quindi mai node_modules/.next/db/storage locali) e compila
# con NSIS (makensis) due eseguibili dalla stessa staging:
# - F90GEST-Setup-Windows.exe: installazione completa (scarica anche il
#   runtime Node.js), da usare solo la prima volta;
# - F90GEST-Aggiornamento-Windows.exe: aggiorna un'installazione gia'
#   esistente (riusa il runtime Node.js gia' installato, niente scelta
#   guidata di una cartella vuota), da usare per tutte le versioni
#   successive alla prima — molto piu' veloce, non ridownloada nulla di
#   pesante.
#
# Richiede: makensis (pacchetto apt "nsis"), git.
# Uso: ./build.sh [commit-o-branch]
#   ./build.sh          # HEAD del branch corrente
#   ./build.sh HEAD

set -e

GIT_REF="${1:-HEAD}"
QUI="$(cd "$(dirname "$0")" && pwd)"
STAGING="$QUI/.staging"

command -v makensis >/dev/null || { echo "makensis non trovato: sudo apt-get install nsis"; exit 1; }

echo "== Pulizia area di staging =="
rm -rf "$STAGING"
mkdir -p "$STAGING/app"

echo "== Snapshot del codice ($GIT_REF) =="
git -C "$QUI/../.." archive --format=tar "$GIT_REF" | tar -x -C "$STAGING/app/"

echo "== Copia script di avvio =="
cp "$QUI/Avvia F90GEST.bat" "$STAGING/"
cp "$QUI/Ferma F90GEST.bat" "$STAGING/"
cp "$QUI/Ferma-silenzioso.bat" "$STAGING/"
cp "$QUI/Azzera-dati.bat" "$STAGING/"
cp "$QUI/installer.nsi" "$STAGING/"
cp "$QUI/aggiornamento.nsi" "$STAGING/"

echo "== Compilazione installer completo (Setup) =="
( cd "$STAGING" && makensis installer.nsi )
mv "$STAGING/F90GEST-Setup-Windows.exe" "$QUI/F90GEST-Setup-Windows.exe"

echo "== Compilazione aggiornamento =="
( cd "$STAGING" && makensis aggiornamento.nsi )
mv "$STAGING/F90GEST-Aggiornamento-Windows.exe" "$QUI/F90GEST-Aggiornamento-Windows.exe"

echo "== Fatto =="
echo "  $QUI/F90GEST-Setup-Windows.exe (prima installazione)"
echo "  $QUI/F90GEST-Aggiornamento-Windows.exe (aggiornamenti successivi)"
