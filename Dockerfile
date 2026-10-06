# syntax=docker/dockerfile:1
FROM node:24-alpine AS builder
# Install libc6-compat for potential native C binary support
RUN apk add --no-cache libc6-compat
RUN npm install --global pnpm@12.4.1

WORKDIR /app

# Copy lockfiles and workspace configuration
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
COPY packages/contracts/package.json packages/contracts/
COPY packages/engine/package.json packages/engine/

# Install all dependencies (including devDependencies) needed for building
RUN pnpm install --frozen-lockfile --filter api...

# Copy source code and run the build process
COPY packages ./packages
COPY apps/api ./apps/api
RUN pnpm --filter api build

# CRITICAL FIX: Prune devDependencies so only production modules remain in node_modules
RUN pnpm prune --prod --no-optional

FROM node:24-alpine AS runner
WORKDIR /app

# Copy only the pruned, production-ready modules and built code
COPY --chown=node:node --from=builder /app/package.json /app/pnpm-workspace.yaml ./
COPY --chown=node:node --from=builder /app/node_modules ./node_modules
COPY --chown=node:node --from=builder /app/packages ./packages
COPY --chown=node:node --from=builder /app/apps/api/package.json ./apps/api/
COPY --chown=node:node --from=builder /app/apps/api/node_modules ./apps/api/node_modules
COPY --chown=node:node --from=builder /app/apps/api/dist ./apps/api/dist

WORKDIR /app/apps/api
USER node
EXPOSE 8080

# The workspace packages ship TypeScript; Node 24 strips types at load, so the
# built server needs no bundler and no tsx.
CMD ["node", "dist/server.js"]

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD ["node", "-e", "fetch('http://127.0.0.1:' + (process.env.PORT || 4000) + '/healthz').then((r) => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"]
