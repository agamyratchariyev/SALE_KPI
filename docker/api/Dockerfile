# Keep this stage identical to the `dependencies` stage in docker/web/Dockerfile:
# BuildKit then reuses one cached `pnpm install` layer for both images.
FROM node:24-alpine AS dependencies

RUN npm install --global pnpm@12.3.4

WORKDIR /workspace

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/shared-types/package.json packages/shared-types/package.json

RUN pnpm install --frozen-lockfile

FROM dependencies AS build

COPY tsconfig.base.json ./
COPY apps/api apps/api

RUN pnpm --filter @retail-kpi/api build

FROM node:24-alpine AS runtime

ENV API_PORT=3000
ENV NODE_ENV=production

WORKDIR /app

RUN mkdir -p /app/uploads && chown node:node /app/uploads

COPY --from=dependencies /workspace/node_modules ./node_modules
COPY --from=dependencies /workspace/apps/api/node_modules ./apps/api/node_modules
COPY --from=build /workspace/apps/api/dist ./apps/api/dist
COPY apps/api/package.json ./apps/api/package.json

USER node

EXPOSE 3000

CMD ["node", "apps/api/dist/main.js"]
