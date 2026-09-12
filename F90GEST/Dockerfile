# Immagine self-hosted per il gestionale: pensata per girare su un mini-PC,
# un NAS o un VPS economico (§4 della specifica di progetto). Nessuna
# dipendenza da servizi cloud a pagamento.

FROM node:22-bookworm-slim AS base
# python3/make/g++ servono solo se il pacchetto nativo better-sqlite3 non
# trova un binario precompilato per la piattaforma di destinazione.
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 make g++ openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app

FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci --legacy-peer-deps

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

FROM base AS runner
ENV NODE_ENV=production
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts
COPY --from=builder /app/package.json ./package.json
COPY docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh \
    && mkdir -p /app/storage /app/prisma/data \
    && groupadd --system --gid 1001 f90gest \
    && useradd --system --uid 1001 --gid f90gest f90gest \
    && chown -R f90gest:f90gest /app

USER f90gest
EXPOSE 3000
ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["npm", "run", "start"]
