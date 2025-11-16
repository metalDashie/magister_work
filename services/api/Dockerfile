# Base stage
FROM node:20-alpine AS base
RUN npm install -g pnpm
WORKDIR /app

# Dependencies stage
FROM base AS dependencies
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/common/package.json ./packages/common/
COPY services/api/package.json ./services/api/
RUN pnpm install --frozen-lockfile

# Build stage
FROM base AS build
COPY --from=dependencies /app/node_modules ./node_modules
COPY packages/common ./packages/common
COPY services/api ./services/api
COPY package.json pnpm-workspace.yaml ./
RUN pnpm --filter @fullmag/api build

# Production stage
FROM base AS production
ENV NODE_ENV=production
COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=build /app/services/api/dist ./services/api/dist
COPY --from=build /app/packages/common ./packages/common
COPY services/api/package.json ./services/api/
WORKDIR /app/services/api
EXPOSE 10001
CMD ["node", "dist/services/api/src/main.js"]
