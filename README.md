# commune-ts

## About

This is a monorepo for the commune ai typescript ecosystem. It uses [Turborepo](https://turborepo.org) and contains:

```text
.github
  └─ workflows
        └─ CI with pnpm cache setup
.vscode
  └─ Recommended extensions and settings for VSCode users
apps
  ├─ commune-governance
  |   ├─ Next.js 14
  |   ├─ React 18
  |   ├─ Tailwind CSS
  |   └─ Subspace calls through the provider library
  ├─ commune-page
  |   ├─ Next.js 14
  |   ├─ React 18
  |   ├─ Tailwind CSS
  |   └─ Docs
  └─ commune-validator
      ├─ Next.js 14
      ├─ React 18
      ├─ Tailwind CSS
      ├─ E2E Typesafe API Server & Client
      └─ Subspace calls through the provider library
packages
  ├─ api
  |   └─ tRPC v11 router definition
  ├─ db
  |   └─ Typesafe db calls using Drizzle & Supabase
  ├─ providers
  |   └─ Subspace/react-query/toast provider library
  ├─ subspace
  |   └─ Subspace client library
  ├─ ui
  |   └─ components library
  └─ validators
      └─ Typesafe validation library
tooling
  ├─ eslint
  |   └─ shared, fine-grained, eslint presets
  ├─ prettier
  |   └─ shared prettier configuration
  ├─ tailwind
  |   └─ shared tailwind configuration
  └─ typescript
      └─ shared tsconfig you can extend from
```

Each package/app is 100% [TypeScript](https://www.typescriptlang.org/).

### To get it running, follow the steps below:

```bash
# Install dependencies
pnpm install

# Configure environment variables
# There is an `.env.example` in the root directory you can use for reference
cp .env.example .env

# Push the Drizzle schema to the database
pnpm db:push
```

## Docker

The Docker setup for each app is in `docker/<app-name>`. You can build and run
the image for the sample app with:

```sh
docker compose -f docker/sample-app/docker-compose.yml up
```

## Useful Links

- [Tasks](https://turbo.build/repo/docs/core-concepts/monorepos/running-tasks)
- [Caching](https://turbo.build/repo/docs/core-concepts/caching)
- [Remote Caching](https://turbo.build/repo/docs/core-concepts/remote-caching)
- [Filtering](https://turbo.build/repo/docs/core-concepts/monorepos/filtering)
- [Configuration Options](https://turbo.build/repo/docs/reference/configuration)
- [CLI Usage](https://turbo.build/repo/docs/reference/command-line-reference)

---

- [TypeScript](https://www.typescriptlang.org/) for static type checking
- [ESLint](https://eslint.org/) for code linting
- [Prettier](https://prettier.io) for code formatting

## URLs

### communex-page (Static SPA site built by Digital Ocean)
PROD: https://communex.ai/ , https://communex-page-xw7rh.ondigitalocean.app/
DEV: https://dev.communex.ai/ , https://dev-communex-page-8aoym.ondigitalocean.app/

### commune-governance (Drone CI for docker image) (not gone live yet)
PROD: https://governance.communeai.org/ , https://commune-governance-q32fh.ondigitalocean.app/ 
DEV: https://dev.governance.communeai.org/ , https://dev-commune-governance-4goke.ondigitalocean.app/

### community validator (Drone CI for docker image)
PROD: https://validator.communeai.net/ , https://community-validator-engn6.ondigitalocean.app/ 
DEV: https://dev.validator.communeai.net/ , https://dev-community-validator-cqpy5.ondigitalocean.app/

### commune page (Drone CI for docker image)
PROD: https://communeai.org/ , https://commune-page-xsrfo.ondigitalocean.app/
DEV: https://dev.communeai.org/ , https://dev-commune-page-33rl9.ondigitalocean.app/

### comrads-worker (Drone CI for docker image)
It's being deployed under the same app as community-validator

## References

The stack originates from [create-t3-app](https://github.com/t3-oss/create-t3-app).
