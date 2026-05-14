FROM oven/bun:1.3.3
WORKDIR /app

RUN addgroup --system --gid 1001 bunjs
RUN adduser --system --uid 1001 bunjs

USER bunjs

COPY --chown=bunjs:bunjs apps/web/.next/standalone ./
COPY --chown=bunjs:bunjs apps/web/.next/static ./apps/web/.next/static
COPY --chown=bunjs:bunjs apps/web/public ./apps/web/public

EXPOSE 3000

CMD ["bun", "./apps/web/server.js"]