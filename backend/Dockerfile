# Stage 0: Build the frontend
FROM node:20-slim AS frontend-builder
WORKDIR /app

COPY package*.json ./
COPY frontend/package*.json ./frontend/
COPY shared/package*.json ./shared/
COPY backend/package*.json ./backend/

RUN npm ci --workspace=@infragest/frontend --workspace=@infragest/shared && \
    npm install @rollup/rollup-linux-x64-gnu

COPY shared/ ./shared/
COPY frontend/ ./frontend/

WORKDIR /app/frontend
RUN npm run build

# Stage 1: Build the backend and shared folders
FROM node:20-alpine AS builder
RUN apk add --no-cache openssl
WORKDIR /app

# Copy package files for dependency resolution
COPY package*.json ./
COPY backend/package*.json ./backend/
COPY shared/package*.json ./shared/
COPY frontend/package*.json ./frontend/

# Install all dependencies (including devDependencies for compilation)
RUN npm ci --workspace=@infragest/backend --workspace=@infragest/shared

# Copy the source code
COPY shared/ ./shared/
COPY backend/ ./backend/

# Run prisma generate
WORKDIR /app/backend
RUN npx prisma generate

# Build backend (tsc)
RUN npm run build

# Stage 2: Runtime
FROM node:20-alpine AS runner
ARG GIT_SHA=unknown
ENV GIT_SHA=$GIT_SHA
RUN apk add --no-cache openssl
WORKDIR /app

# Copy production package files
COPY package*.json ./
COPY backend/package*.json ./backend/
COPY shared/package*.json ./shared/
COPY frontend/package*.json ./frontend/

# Install only production dependencies
RUN npm ci --omit=dev --workspace=@infragest/backend --workspace=@infragest/shared

# Copy generated prisma client and built code
COPY --from=builder /app/backend/dist ./backend/dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma/client ./node_modules/@prisma/client
COPY --from=builder /app/backend/prisma ./backend/prisma
COPY --from=builder /app/shared ./shared

WORKDIR /app/backend

# Bundle the frontend static files so Fastify can serve the SPA
COPY --from=frontend-builder /app/frontend/dist ./public/

# Add entrypoint script to run migrations and start server
COPY backend/docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

EXPOSE 3000
ENTRYPOINT ["./docker-entrypoint.sh"]
