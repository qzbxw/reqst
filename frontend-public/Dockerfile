FROM node:22-alpine AS builder

WORKDIR /app
ARG NEXT_PUBLIC_API_URL=http://localhost:3000
ARG NEXT_PUBLIC_SITE_URL=https://reqst.xyz
ARG PUBLIC_APP_URL=https://reqst.xyz
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NEXT_PUBLIC_SITE_URL=${NEXT_PUBLIC_SITE_URL}
ENV PUBLIC_APP_URL=${PUBLIC_APP_URL}
COPY frontend-public/package*.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci

COPY frontend-public ./
RUN --mount=type=cache,target=/app/.next/cache \
    npm run build

FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
