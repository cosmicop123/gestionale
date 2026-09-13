#!/bin/sh
# Costruisce l'installer Windows di F90GEST (Setup.exe) da un ambiente
# Linux: prende uno snapshot pulito del codice dal branch corrente (git
# archive: rispetta .gitignore, quindi mai node_modules/.next/db/storage
# locali) e compila tutto con NSIS (makensis). Il runtime Node.js NON
# viene incluso qui: l'installer lo scarica da nodejs.org al momento
# dell'installazione (vedi installer.nsi), per tenere questo eseguibile
# piccolo e facile da distribuire.
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
cp "$QUI/installer.nsi" "$STAGING/"

echo "== Compilazione con NSIS =="
( cd "$STAGING" && makensis installer.nsi )
mv "$STAGING/F90GEST-Setup-Windows.exe" "$QUI/F90GEST-Setup-Windows.exe"

echo "== Fatto: $QUI/F90GEST-Setup-Windows.exe =="
