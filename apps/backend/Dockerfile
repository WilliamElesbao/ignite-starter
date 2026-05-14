FROM oven/bun:1.3.3
WORKDIR /app

# Don't run production as root
RUN addgroup --system --gid 1001 bunjs
RUN adduser --system --uid 1001 bunjs
USER bunjs

ENV NODE_ENV=production
ENV BUN_INSTALL=/tmp/bun
ENV BUN_RUNTIME_DIR=/tmp/bun/runtime
ENV XDG_CACHE_HOME=/tmp/bun/cache

RUN mkdir -p /tmp/bun/runtime /tmp/bun/cache

COPY --chown=bunjs:bunjs apps/backend/dist ./apps/backend/dist
COPY --chown=bunjs:bunjs packages/database/dist ./packages/database/dist
COPY --chown=bunjs:bunjs packages/database/migrations ./packages/database/migrations

CMD ["bun", "./apps/backend/dist/index.js"]