# This is called a multi-stage build
# First up, we define a "builder" image, based on some publicly available Node image.
# During the builder stage, we install necessary build tools, copy all the source code, install dependencies, and run the build command.
# Due to all these developer tools and source code, this image can get quite large, whilst we only need a very small part of it to actually run the application.
# For this reason, we define a second base image, the "runtime" image, which will only contain the built application and its runtime dependencies.
# Overall, this results in a much smaller image that is more suitable for production use.

FROM node:lts-alpine AS builder

WORKDIR /app
RUN apk add --update g++ make python3 && rm -rf /var/cache/apk/*

COPY . .

RUN npm ci

RUN npm run build

FROM node:lts-alpine AS runtime

WORKDIR /app

# Important: Copy from builder stage
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/package-lock.json ./package-lock.json
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

# Install only production (runtime) dependencies
RUN npm ci --omit=dev

# Ensure Prisma is installed for runtime migrations
RUN npm install prisma

ENTRYPOINT exec npm run prisma:deploy && node ./dist/src/main.js