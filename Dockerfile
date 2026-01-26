# This Dockerfile intentionally builds **two different container images** from the same source code + Dockerfile.
# We can do this by utilizing  Docker *multi-stage builds* and *named targets*.
#
# WHY
# ---------------
# Our NestJS application uses Prisma.
# Prisma has two very different responsibilities:
#
# 1) Runtime usage
#    - Querying the database at runtime via the generated Prisma client @prisma/client
#    - No Prisma CLI is required (very large dependency)
#    - This should be as small and secure as possible
#
# 2) Database migrations
#    - Running `prisma migrate deploy` to apply migrations to the database, requires the Prisma CLI and schema files
#    - These tools are heavy and not needed at runtime otherwise
#    - Migrations should run ONCE per deployment, not every time the app starts
#
# Shipping the Prisma CLI in the runtime image:
#   - Dramatically increases image size
#   - Risks multiple containers running migrations simultaneously against the same database (e.g. when horizontal scaling)
#
# For these reasons, we split responsibilities into two images:
#
#   - "app"     → Production runtime image (small, fast, no Prisma CLI)
#   - "migrate" → One-off job image used only to run database migrations
#
#
# HOW THIS FILE IS USED
# --------------------
# GitHub Actions builds TWO images from this ONE Dockerfile:
#
#   docker build --target app     -t helios:app     .
#   docker build --target migrate -t helios:migrate .
#
# Both images are pushed to the same container registry.
#
# In deployment (Docker Compose / Portainer / CI):
#   1) The "migrate" image is run once to apply database migrations
#   2) After migrations succeed, the "app" image is started
#
# This keeps production images small, startup predictable,
# and database migrations safe and explicit.
#
# --------------------------------------------------------------------

# ---------- base deps (dev deps included) ----------
FROM node:24-alpine AS deps
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

# ---------- build ----------
FROM deps AS build
WORKDIR /app

COPY . .

# Generate Prisma client (required for runtime)
RUN npx prisma generate

# Build NestJS
RUN npm run build

# ---------- app runtime (small) ----------
FROM node:24-alpine AS app
WORKDIR /app
ENV NODE_ENV=production

# Install only production deps (must include @prisma/client in dependencies)
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund

# Copy compiled app
COPY --from=build /app/dist ./dist

# Copy Prisma client engine artifacts from the build stage
# (These are often required at runtime for Prisma to work reliably)
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /app/node_modules/@prisma ./node_modules/@prisma

EXPOSE 3000
CMD ["node", "dist/src/main.js"]

# ---------- migrate job ----------
FROM deps AS migrate
WORKDIR /app

# Only what's needed to run migrations
COPY --from=build /app/prisma ./prisma

# Need to have the prisma configuration file
COPY --from=build /app/prisma.config.ts ./prisma.config.ts

# Run migrations
CMD ["npx", "prisma", "migrate", "deploy"]