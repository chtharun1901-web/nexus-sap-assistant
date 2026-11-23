# ==============================================================================
# Multi-Stage Production Packaging for Nexus SAP Operations Copilot
# ==============================================================================

# ── Stage 1: Frontend Build Stage ─────────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

# Install client build dependencies
COPY client/package*.json ./client/
RUN npm --prefix client install

# Build client React/Vite assets (outputs to /app/public)
COPY client/ ./client/
RUN npm --prefix client run build

# ── Stage 2: Minimal Production Runtime ───────────────────────────────────────
FROM node:22-alpine AS runner

WORKDIR /app

# Copy root dependencies and install only production modules
COPY package*.json ./
RUN npm install --omit=dev && npm cache clean --force

# Copy built frontend assets from builder stage
COPY --from=builder /app/public ./public

# Copy backend application source and service modules
COPY server.js db.js ./
COPY services/ ./services/
COPY templates/ ./templates/

# Configuration
EXPOSE 3456
ENV PORT=3456
ENV NODE_ENV=production

# Container Health Check (Verifies core health endpoint)
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://localhost:3456/api/auth/google/config').then(r => r.ok ? process.exit(0) : process.exit(1)).catch(() => process.exit(1))"

# Start production server
CMD ["node", "server.js"]
