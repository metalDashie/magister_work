# Base stage
FROM node:20-alpine AS base
RUN npm install -g pnpm
WORKDIR /app

# Dependencies stage
FROM base AS dependencies
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/common/package.json ./packages/common/
COPY apps/web/package.json ./apps/web/
RUN pnpm install --frozen-lockfile

# Build stage
FROM base AS build
COPY --from=dependencies /app/node_modules ./node_modules
COPY packages/common ./packages/common
COPY apps/web ./apps/web
COPY package.json pnpm-workspace.yaml ./
RUN pnpm --filter @fullmag/web build

# Production stage
FROM base AS production
ENV NODE_ENV=production
ENV PORT=10002
COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=build /app/apps/web/.next ./apps/web/.next
COPY --from=build /app/apps/web/public ./apps/web/public
COPY --from=build /app/packages/common ./packages/common
COPY apps/web/package.json ./apps/web/
COPY apps/web/next.config.js ./apps/web/
WORKDIR /app/apps/web
EXPOSE 10002
CMD ["pnpm", "start"]
