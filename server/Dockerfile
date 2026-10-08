# Build context: the repository root (docker build -f server/Dockerfile .)
FROM oven/bun:1.3-alpine AS deps
WORKDIR /app
COPY package.json bun.lock bunfig.toml ./
COPY server/package.json ./server/
COPY client/package.json ./client/
RUN bun install --frozen-lockfile

FROM oven/bun:1.3-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY package.json bunfig.toml tsconfig.json ./
COPY shared/ ./shared/
COPY server/ ./server/
RUN bun run server/build.ts

# Runtime: the bundle is self-contained. Layout matters: dist/*.js resolve ../templates and
# ../db/migrations at runtime.
FROM oven/bun:1.3-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8000
COPY --from=build --chown=bun:bun /app/server/dist ./dist
COPY --from=build --chown=bun:bun /app/server/templates ./templates
COPY --from=build --chown=bun:bun /app/server/db/migrations ./db/migrations
COPY --chown=bun:bun server/entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh && mkdir -p /app/storage && chown bun:bun /app/storage
USER bun
EXPOSE 8000
ENTRYPOINT ["./entrypoint.sh"]
