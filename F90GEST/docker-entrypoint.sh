#!/bin/sh
# Applica le migrazioni Prisma e verifica/crea i dati minimi (seed è
# idempotente) prima di avviare il server. Così un aggiornamento
# dell'immagine (docker compose pull && up) applica sempre lo schema
# corrente senza intervento manuale.
set -e

echo "Applico le migrazioni del database..."
npx prisma migrate deploy

echo "Verifico i dati minimi (associazione, utente amministratore, parametri)..."
npx prisma db seed

exec "$@"
