# Multi-stage build for standalone Durable Streams server
# This Dockerfile should be run from the monorepo root with:
#   docker build -f packages/server/Dockerfile -t durable-streams-server .

# Build stage - compile TypeScript and native modules
FROM node:22-alpine AS builder

# Install build tools required for native modules (lmdb)
RUN apk add --no-cache python3 make g++

WORKDIR /build

# Enable corepack for pnpm
RUN corepack enable

# Copy workspace files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.json ./
COPY packages/client/package.json ./packages/client/package.json
COPY packages/state/package.json ./packages/state/package.json
COPY packages/server/package.json ./packages/server/package.json

# Install all dependencies (including workspace deps and native modules)
RUN pnpm install --frozen-lockfile

# Copy source code and TypeScript configs
COPY packages/client ./packages/client
COPY packages/state ./packages/state
COPY packages/server ./packages/server

# Build packages in dependency order
RUN pnpm --filter @durable-streams/client build
RUN pnpm --filter @durable-streams/state build
RUN pnpm --filter @durable-streams/server build

# Runtime stage - minimal image with only runtime dependencies
FROM node:22-alpine AS runtime

# Install runtime dependencies for native modules
RUN apk add --no-cache libstdc++ libc6-compat

WORKDIR /app

# Copy the entire node_modules and pnpm structure from builder
COPY --from=builder /build/node_modules ./node_modules
COPY --from=builder /build/package.json /build/pnpm-workspace.yaml ./

# Copy built packages with their node_modules (contains symlinks to pnpm store)
COPY --from=builder /build/packages/client/dist ./packages/client/dist
COPY --from=builder /build/packages/client/package.json ./packages/client/package.json
COPY --from=builder /build/packages/client/node_modules ./packages/client/node_modules

COPY --from=builder /build/packages/state/dist ./packages/state/dist
COPY --from=builder /build/packages/state/package.json ./packages/state/package.json
COPY --from=builder /build/packages/state/node_modules ./packages/state/node_modules

COPY --from=builder /build/packages/server/dist ./packages/server/dist
COPY --from=builder /build/packages/server/package.json ./packages/server/package.json
COPY --from=builder /build/packages/server/node_modules ./packages/server/node_modules

# Copy the server entry point
COPY --from=builder /build/packages/server/docker-entrypoint.js ./server.js

# Expose the default port
EXPOSE 4437

# Set default environment variables
ENV NODE_ENV=production
ENV PORT=4437
ENV HOST=0.0.0.0

# Run the server
CMD ["node", "server.js"]
