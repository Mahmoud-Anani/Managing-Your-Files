# syntax=docker/dockerfile:1

# ---------------------------------------------------------------------------
# deps: install all dependencies (including dev: prisma CLI, typescript)
# ---------------------------------------------------------------------------
FROM node:22-alpine AS deps
WORKDIR /app
ENV NODE_ENV=development

COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci
RUN npx prisma generate

# ---------------------------------------------------------------------------
# build: compile TypeScript to dist/; compile the seed script so it can run
# with plain `node` in the production image (no ts-node needed at runtime)
# ---------------------------------------------------------------------------
FROM deps AS build
COPY src ./src
COPY tsconfig.json ./
RUN npm run build

RUN npx tsc prisma/seed.ts \
    --outDir ./dist-seed \
    --module commonjs \
    --moduleResolution node \
    --target ES2022 \
    --esModuleInterop \
    --skipLibCheck \
    --strict

# ---------------------------------------------------------------------------
# runtime: production-only dependencies + compiled output + Prisma engine
# ---------------------------------------------------------------------------
FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Production `npm ci` cannot generate the Prisma client (the CLI is a dev
# dependency), so copy the generated client, engine binaries and the CLI from
# the build stage. The CLI is still needed at runtime for `prisma migrate deploy`.
COPY --from=build /app/node_modules/@prisma/client ./node_modules/@prisma/client
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /app/node_modules/prisma ./node_modules/prisma
RUN mkdir -p node_modules/.bin \
    && ln -s ../prisma/build/index.js node_modules/.bin/prisma

COPY --from=build /app/dist ./dist
COPY --from=build /app/dist-seed ./dist-seed
COPY prisma ./prisma
COPY docker-entrypoint.sh ./docker-entrypoint.sh

USER node
EXPOSE 3001

ENTRYPOINT ["/bin/sh", "./docker-entrypoint.sh"]