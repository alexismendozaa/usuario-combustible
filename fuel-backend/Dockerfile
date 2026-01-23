# ============================================
# Fuel Backend - Dockerfile
# Multi-stage build for production optimization
# ============================================

# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app

# Instalar dependencias necesarias para bcrypt y prisma
RUN apk add --no-cache libc6-compat openssl python3 make g++

# Copiar archivos de dependencias
COPY package.json package-lock.json ./
COPY prisma ./prisma/
COPY prisma.config.ts ./

# Instalar dependencias
RUN npm ci

# Prisma 7: generate no conecta a la DB, solo necesita el schema
ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"
RUN npx prisma generate

# Copiar código fuente
COPY tsconfig.json tsconfig.build.json nest-cli.json ./
COPY src ./src

# Build de producción
RUN npm run build

# Verificar que el build se generó
RUN ls -la dist/

# ============================================
# Stage 2: Production Runner
FROM node:20-alpine AS runner
WORKDIR /app

# Instalar dependencias necesarias
RUN apk add --no-cache libc6-compat openssl

# Crear usuario no-root para seguridad
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nestjs

# Copiar archivos necesarios para producción
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts
COPY --from=builder /app/package.json ./package.json

# Cambiar a usuario no-root
USER nestjs

# Exponer puerto
EXPOSE 3000

# Variables de entorno por defecto
ENV NODE_ENV=production
ENV PORT=3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1

# Comando de inicio
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/src/main.js"]
