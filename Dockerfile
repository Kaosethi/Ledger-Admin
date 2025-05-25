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
COPY .env.local ./

# Set environment variables
ENV NODE_ENV=production

# Build the application
RUN bun run build

# Production stage
FROM node:22-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Copy built application - .next directory, package.json, and node_modules are needed
COPY --from=base /app/.next ./.next
COPY --from=base /app/public ./public
COPY --from=base /app/package.json ./package.json
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/.env.local ./

# Expose application port
EXPOSE 3000

# Start the application
CMD ["node", "node_modules/next/dist/bin/next", "start"]