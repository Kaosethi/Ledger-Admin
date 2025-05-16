FROM oven/bun:1.2.10 AS base

# Copy node from node image for compatibility
COPY --from=node:22 /usr/local/bin/node /usr/local/bin/node

WORKDIR /app

# Copy package files and install dependencies
COPY package.json bun.lock ./
RUN bun install

# Copy application source
COPY tsconfig.json next.config.js tailwind.config.js postcss.config.js ./
COPY src/ ./src/
COPY public/ ./public/

# Set environment variables
ENV NODE_ENV=production
ARG DATABASE_URL
ENV DATABASE_URL=${DATABASE_URL}

# Build the application
RUN bun run build

# Production stage
FROM node:22-slim as runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Copy built application
COPY --from=base /app/.next/standalone ./
COPY --from=base /app/.next/static ./.next/static
COPY --from=base /app/public ./public

# Expose application port
EXPOSE 3000

# Start the application
CMD ["node", "server.js"]