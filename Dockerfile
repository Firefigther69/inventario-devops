# syntax=docker/dockerfile:1
# ---------- Etapa 1: dependencias de producción ----------
FROM node:20-alpine AS deps
WORKDIR /app
COPY app/package.json app/package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

# ---------- Etapa 2: imagen final mínima ----------
FROM node:20-alpine AS runtime
ARG APP_VERSION=dev
LABEL org.opencontainers.image.title="inventario-api" \
      org.opencontainers.image.description="Sistema de gestión de inventario" \
      org.opencontainers.image.version="${APP_VERSION}"

ENV NODE_ENV=production \
    PORT=3000 \
    APP_VERSION=${APP_VERSION}

# npm/npx no se usan en ejecución: se eliminan para reducir superficie de ataque
# (el npm incluido en la imagen base arrastra dependencias con CVE críticas).
RUN rm -rf /usr/local/lib/node_modules/npm /usr/local/lib/node_modules/corepack \
           /usr/local/bin/npm /usr/local/bin/npx /usr/local/bin/corepack

WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY app/package.json ./
COPY app/src ./src
COPY app/public ./public

# Ejecutar como usuario sin privilegios (incluido en la imagen oficial de Node)
USER node
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/health || exit 1

CMD ["node", "src/server.js"]
