ARG APP_NAME

# ======== base layer ======== #
FROM node:20-slim AS base

# Setup pnpm
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
RUN pnpm --version

# Install turbo
RUN npm install -g "turbo@^2.0.3"


# ======== pruner layer ======== #
FROM base AS pruner
ARG APP_NAME

COPY . /build
WORKDIR /build

# Prune input packages to only what is needed for the app.  
# Docs: https://turbo.build/repo/docs/guides/tools/docker
RUN turbo prune ${APP_NAME} --docker


# ======== builder layer ======== #
FROM base AS builder
ARG APP_NAME

WORKDIR /app

COPY --from=pruner /build/out/pnpm-lock.yaml ./pnpm-lock.yaml

# Install dependencies using only package.json files to reduce changes
COPY --from=pruner /build/out/json/ .
RUN --mount=type=cache,id=pnpm,target=/pnpm/store  pnpm install --frozen-lockfile

# Build the app
COPY --from=pruner /build/out/full/ .
RUN pnpm turbo run build --filter=${APP_NAME}


# ======== runner layer ======== #
FROM base AS runner

ARG APP_NAME

WORKDIR /app

COPY --from=builder /app/ .

WORKDIR /app/apps/${APP_NAME}

EXPOSE 8000

CMD [ "pnpm", "run", "start" ]