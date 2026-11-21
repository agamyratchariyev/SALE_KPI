# Keep this stage identical to the `dependencies` stage in docker/api/Dockerfile:
# BuildKit then reuses one cached `pnpm install` layer for both images, and it is
# rebuilt only when a manifest or the lockfile changes, not on every source edit.
FROM node:24-alpine AS dependencies

RUN npm install --global pnpm@12.3.4

WORKDIR /workspace

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/shared-types/package.json packages/shared-types/package.json
COPY docker/install-dependencies.mjs docker/install-dependencies.mjs

# Optional: fewer parallel downloads for a proxy that drops extra connections.
ARG PNPM_NETWORK_CONCURRENCY=
# Retries over a bad connection and fails when pnpm skipped a native package (ADR-073).
RUN node docker/install-dependencies.mjs

FROM dependencies AS build

COPY tsconfig.base.json ./
COPY apps/web apps/web

ARG VITE_API_BASE_URL=http://localhost:3000
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

RUN pnpm --filter @retail-kpi/web build

FROM nginx:1.29-alpine AS runtime

COPY docker/web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /workspace/apps/web/dist /usr/share/nginx/html

EXPOSE 80
