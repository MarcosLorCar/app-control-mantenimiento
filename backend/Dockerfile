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

# Add entrypoint script to run migrations and start server
COPY backend/docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

EXPOSE 3000
ENTRYPOINT ["./docker-entrypoint.sh"]
