# Stage 1: Build the React application
FROM node:20-alpine AS builder
WORKDIR /app

# Copy package files for dependency resolution
COPY package*.json ./
COPY frontend/package*.json ./frontend/
COPY shared/package*.json ./shared/

# Install dependencies
RUN npm ci && npm install @rollup/rollup-linux-x64-musl

# Copy the source code
COPY shared/ ./shared/
COPY frontend/ ./frontend/

# Build frontend (tsc && vite build)
WORKDIR /app/frontend
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine AS runner
COPY --from=builder /app/frontend/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
