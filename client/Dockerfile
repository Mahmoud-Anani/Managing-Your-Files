# syntax=docker/dockerfile:1

# ---------------------------------------------------------------------------
# deps: install all dependencies (including dev: typescript, tailwind, eslint)
# ---------------------------------------------------------------------------
FROM node:22-alpine AS deps
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

# ---------------------------------------------------------------------------
# build: run the production Next.js build. NEXT_PUBLIC_API_URL is inlined into
# the bundle at build time, so it is passed in as a build argument.
# ---------------------------------------------------------------------------
FROM deps AS build
COPY . .

ARG NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# ---------------------------------------------------------------------------
# runtime: production-only dependencies + the prebuilt app
# ---------------------------------------------------------------------------
FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/next.config.ts ./next.config.ts
COPY --from=build /app/next-env.d.ts ./next-env.d.ts
COPY --from=build /app/tsconfig.json ./tsconfig.json

USER node
EXPOSE 3002
ENV PORT=3002

CMD ["npm", "run", "start"]