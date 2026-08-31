# syntax=docker/dockerfile:1
FROM node:20-bookworm-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:20-bookworm-slim AS build
WORKDIR /app
ARG NEXT_PUBLIC_API_BASE_URL
ARG NEXT_PUBLIC_WS_URL
ARG NEXT_PUBLIC_ORGANIZATION_NAME
ARG NEXT_PUBLIC_PORTAL=staff
ARG NEXT_PUBLIC_LP_PORTAL_URL
ARG NEXT_PUBLIC_INVESTEE_PORTAL_URL
ARG NEXT_PUBLIC_AUTH_TOKEN_KEY=token
ARG NEXT_PUBLIC_AUTH_USER_KEY=user
ARG NEXT_PUBLIC_AUTH_PROFILE_KEY=userProfile
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL
ENV NEXT_PUBLIC_WS_URL=$NEXT_PUBLIC_WS_URL
ENV NEXT_PUBLIC_ORGANIZATION_NAME=$NEXT_PUBLIC_ORGANIZATION_NAME
ENV NEXT_PUBLIC_PORTAL=$NEXT_PUBLIC_PORTAL
ENV NEXT_PUBLIC_LP_PORTAL_URL=$NEXT_PUBLIC_LP_PORTAL_URL
ENV NEXT_PUBLIC_INVESTEE_PORTAL_URL=$NEXT_PUBLIC_INVESTEE_PORTAL_URL
ENV NEXT_PUBLIC_AUTH_TOKEN_KEY=$NEXT_PUBLIC_AUTH_TOKEN_KEY
ENV NEXT_PUBLIC_AUTH_USER_KEY=$NEXT_PUBLIC_AUTH_USER_KEY
ENV NEXT_PUBLIC_AUTH_PROFILE_KEY=$NEXT_PUBLIC_AUTH_PROFILE_KEY
ENV NODE_OPTIONS=--max-old-space-size=4096
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:20-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
RUN apt-get update && apt-get install -y --no-install-recommends curl \
  && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json next.config.mjs ./
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
EXPOSE 3000
HEALTHCHECK --interval=20s --timeout=5s --start-period=40s --retries=5 \
  CMD curl -fsS http://127.0.0.1:3000/ || exit 1
CMD ["npx", "next", "start", "-p", "3000"]
