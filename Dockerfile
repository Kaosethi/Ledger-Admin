FROM oven/bun:1.2.10-slim AS build

WORKDIR /app

COPY package.json bun.lock ./
# COPY .env.example .env.local

RUN bun install

COPY tsconfig.json next.config.ts postcss.config.mjs tailwind.config.js ./

COPY src/ ./src/
COPY public/ ./public/

ENV NODE_ENV=production
RUN bun run build

# RUN rm .env.local

FROM oven/bun:1.2.10-slim

WORKDIR /app

ENV NODE_ENV=production

COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public

EXPOSE 3000

CMD ["bun", "server.js"]