# Journal — Server/Dockerfile
#
# Before (user): two-stage build on node:22-alpine — stage 1 installs all deps with pnpm and compiles TypeScript,
#   stage 2 installs production deps only, copies dist/ and runs `node dist/index.js` with mode=production.
#
# 2026-10-12 (Claude): Runs as the image's unprivileged `node` user instead of root.
#   Render sets PORT; src/index.ts reads it.

FROM node:22-alpine AS build
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY tsconfig.json ./
COPY src ./src
RUN pnpm build

FROM node:22-alpine
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod
COPY --from=build /app/dist ./dist
ENV mode=production
# don't run the server as root
USER node
CMD ["node", "dist/index.js"]
