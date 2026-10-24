# =========================================================================
# RouteShield — Multi-stage Production Dockerfile
# =========================================================================

FROM node:22-alpine AS base

# Install security updates
RUN apk --no-cache add ca-certificates

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Bundle application source
COPY . .

# Create uploads directory and set permissions
RUN mkdir -p uploads && chown -R node:node /app

# Drop root privileges
USER node

# Expose HTTP Port
EXPOSE 5000

# Environment variables
ENV NODE_ENV=production
ENV PORT=5000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/api/health || exit 1

# Start RouteShield Server
CMD ["node", "backend/src/server.js"]
