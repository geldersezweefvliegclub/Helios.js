# Project Guidelines

## Rewrite Goal

- Helios.js is a NestJS rewrite of the legacy PHP backend in the sibling workspace folder `Helios`.
- Preserve backward compatibility at the API layer unless a task explicitly says otherwise. Keep existing resource names, action-style endpoints, uppercase query/body field names, and the `GetObjects` response envelope (`dataset`, `totaal`, `hash`).
- When behavior is unclear, treat the legacy implementation as the source of truth: `Helios/docs/*.yml` for the OpenAPI contract, `Helios/routes/route.*.php` for endpoint names, and `Helios/lib/class.*.inc.php` plus `Helios/include/helios.php` for query and business rules.

## Architecture

- Follow the existing vertical-slice module structure under [src/modules](../src/modules): each domain keeps its controller, service, module, and request/response classes together. Use [src/modules/leden](../src/modules/leden) as the primary example.
- Reuse the shared Helios HTTP patterns in [src/core/controllers/helios/helios.controller.ts](../src/core/controllers/helios/helios.controller.ts) and the shared response/query helpers in [src/core/services/IHeliosService.ts](../src/core/services/IHeliosService.ts).
- Keep Dutch domain naming and the current PascalCase endpoint style. New compatibility endpoints should look like `/Leden/GetObject`, `/Leden/GetObjects`, `/Leden/AddObject`, not generic REST routes.
- Register new feature modules through [src/app.module.ts](../src/app.module.ts) and keep shared infrastructure inside [src/core](../src/core) and [src/database](../src/database).

## Data and Prisma

- Use [src/database/db-service/db.service.ts](../src/database/db-service/db.service.ts) for Prisma access. Do not instantiate `PrismaClient` directly inside feature modules.
- The Prisma schema is split across [prisma/schema](../prisma/schema). Generated DTOs in [src/generated/nestjs-dto](../src/generated/nestjs-dto) are generated artifacts; do not hand-edit them.
- After changing Prisma schema files, run `npm run prisma:generate`. Use `npm run prisma:deploy` only for deployment or migration work.
- Preserve legacy field naming in DTOs and responses, even when it is unusual for TypeScript. Database and API fields are often uppercase and should stay that way for compatibility.
- Prefer matching legacy read behavior first. For write endpoints, preserve legacy semantics such as soft-delete via `VERWIJDERD` instead of introducing new patterns.

## Build and Test

- Use the actual project scripts in [package.json](../package.json): `npm ci`, `npm run build`, `npm test`, `npm run test:e2e`, `npm run prisma:generate`.
- Compatibility work should be checked against [test/compare-api-responses.spec.ts](../test/compare-api-responses.spec.ts). That test requires both the PHP API and the NestJS API to be running, plus the `TESTING_PHP_*` and `TESTING_NESTJS_*` environment variables.
- Treat [README.md](../README.md) as incomplete boilerplate unless it matches the code. The current CI definition in [.github/workflows/main.yml](workflows/main.yml) is the more reliable source for enforced build behavior.
- When changing deployment or migration behavior, also inspect [Dockerfile](../Dockerfile) and [docker-compose-prod.yml](../docker-compose-prod.yml), because production runs Prisma migration steps separately from the app container.

## Conventions and Pitfalls

- `GetObjects` endpoints should preserve the existing query conventions such as `ID`, `MAX`, `START`, `SORT`, `VERWIJDERD`, and `HASH`, plus the current hash-based `304 Not Modified` behavior where it already exists.
- Put authorization and privacy masking where existing modules do: compare [src/modules/leden/leden.controller.ts](../src/modules/leden/leden.controller.ts) and [src/modules/login](../src/modules/login). Match legacy behavior before attempting cleanup or redesign.
- Reuse shared decorators and response helpers before adding endpoint-specific Swagger or response-envelope code.
- Configuration is loaded from `helios-config.json` by [src/config/configuration.ts](../src/config/configuration.ts). Do not rely on the fallback defaults in that file, and never commit real credentials or secrets.