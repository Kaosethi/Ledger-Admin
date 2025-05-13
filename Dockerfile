# Build stage
FROM oven/bun:1.2.10-slim AS builder

WORKDIR /app

# Install dependencies
COPY package.json bun.lock ./
RUN bun install

# Copy source files
COPY tsconfig.json next.config.ts ./
COPY src/ ./src/
COPY public/ ./public/

# Set environment variables for build
ARG NODE_ENV
ARG DATABASE_URL
ENV NODE_ENV=${NODE_ENV}
ENV DATABASE_URL=${DATABASE_URL}

# Build the application
RUN bun run build

# Production stage
FROM oven/bun:1.2.10-slim

WORKDIR /app

# Copy built application from builder
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/bun.lock ./bun.lock
COPY --from=builder /app/node_modules ./node_modules

# Set environment variables
ARG NODE_ENV
ARG DATABASE_URL
ENV NODE_ENV=${NODE_ENV}
ENV PORT=3000
ENV DATABASE_URL=${DATABASE_URL}

# Expose the port the app runs on
EXPOSE 3000

# Start the application
CMD ["bun", "run", "start"]