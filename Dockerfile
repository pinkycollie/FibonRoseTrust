# FibonRose Trust - Dockerfile
# Multi-stage build for optimal production image

# ===========================================
# Stage 1: Development Dependencies
# ===========================================
FROM node:20-alpine AS development

WORKDIR /app

# Install dependencies for native modules
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package*.json ./

# Install all dependencies (including devDependencies)
RUN npm ci

# Copy source code
COPY . .

# Expose port
EXPOSE 5000

# Default command for development
CMD ["npm", "run", "dev"]

# ===========================================
# Stage 2: Build
# ===========================================
FROM development AS builder

# Build the application
RUN npm run build

# ===========================================
# Stage 3: Production
# ===========================================
FROM node:20-alpine AS production

WORKDIR /app

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production && npm cache clean --force

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/dist/public ./dist/public 2>/dev/null || true

# Change ownership to non-root user
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:5000/api/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

# Start the application
CMD ["node", "dist/index.js"]
