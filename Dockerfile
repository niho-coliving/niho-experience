# Public site image for Cloud Run (docs/adr/0001-web-stack.md).
# Built from a reviewed commit with no secrets; environment settings are given at deploy time.
ARG NODE_IMAGE=node:24-bookworm-slim@sha256:a5f4366e834695d5f363b920c104953a535d3a9864d1bdf74566a0ebe01daee5

FROM ${NODE_IMAGE} AS build
WORKDIR /repo
ENV NEXT_TELEMETRY_DISABLED=1
COPY package.json package-lock.json ./
COPY apps/web/package.json apps/web/
COPY packages/api-client/package.json packages/api-client/
COPY packages/experience-presentation/package.json packages/experience-presentation/
RUN npm ci --no-audit --no-fund
COPY . .
# CSP headers are immutable: candidates receive their approved API origin at build time.
ARG NIHO_WEB_CSP_ORIGIN=https://niho.life
RUN NEXT_PUBLIC_NIHO_WEB_ORIGIN="$NIHO_WEB_CSP_ORIGIN" npm run build

FROM ${NODE_IMAGE} AS runtime
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=8080 \
    HOSTNAME=0.0.0.0
COPY --from=build --chown=node:node /repo/apps/web/.next/standalone ./
COPY --from=build --chown=node:node /repo/apps/web/.next/static ./apps/web/.next/static
COPY --from=build --chown=node:node /repo/apps/web/public ./apps/web/public
USER node
EXPOSE 8080
CMD ["node", "apps/web/server.js"]
