#!/bin/sh
# Costruisce l'installer Windows di F90GEST (Setup.exe) da un ambiente
# Linux: scarica il runtime Node.js portatile per Windows, prende uno
# snapshot pulito del codice dal branch corrente (git archive: rispetta
# .gitignore, quindi mai node_modules/.next/db/storage locali) e compila
# tutto con NSIS (makensis).
#
# Richiede: makensis (pacchetto apt "nsis"), curl, unzip, git.
# Uso: ./build.sh [versione-node] [commit-o-branch]
#   ./build.sh                     # usa i default sotto, HEAD del branch corrente
#   ./build.sh 22.23.2 HEAD

set -e

NODE_VERSION="${1:-22.23.2}"
GIT_REF="${2:-HEAD}"
QUI="$(cd "$(dirname "$0")" && pwd)"
STAGING="$QUI/.staging"

command -v makensis >/dev/null || { echo "makensis non trovato: sudo apt-get install nsis"; exit 1; }

echo "== Pulizia area di staging =="
rm -rf "$STAGING"
mkdir -p "$STAGING/node" "$STAGING/app"

echo "== Download Node.js v$NODE_VERSION (Windows x64) =="
NODE_ZIP="$STAGING/node-win.zip"
curl -sSL -o "$NODE_ZIP" "https://nodejs.org/dist/v${NODE_VERSION}/node-v${NODE_VERSION}-win-x64.zip"
unzip -q "$NODE_ZIP" -d "$STAGING/node-extract"
mv "$STAGING/node-extract/node-v${NODE_VERSION}-win-x64"/* "$STAGING/node/"
rm -rf "$STAGING/node-extract" "$NODE_ZIP"

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
