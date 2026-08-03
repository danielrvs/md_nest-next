# AGENTS.md — MD Nest-Next (Directorio Médico Enterprise)

> Agent behavioral rules and coding conventions for this NestJS 11 + Next.js 16 monorepo.
> These rules are **binding** for every AI agent working in this workspace.

---

## Project Overview

**Directorio Médico Enterprise** is a fullstack, Dockerized medical directory and health portal platform, migrated from WordPress to a modern decoupled stack:

- **Backend**: NestJS 11 · Node.js 24 · TypeScript · Prisma ORM · PostgreSQL 18
- **Frontend**: Next.js 16 (App Router) · React 19 · Tailwind CSS v4 · Shadcn/ui
- **Infrastructure**: Redis 8 · RabbitMQ · MinIO · Mailpit · Prometheus · Grafana

---

## Repository Structure

```
/
├── backend/          # NestJS API server
│   ├── src/
│   │   ├── modules/  # Domain modules (auth, users, doctors, specialties, …)
│   │   └── shared/   # Cross-cutting infrastructure
│   ├── prisma/       # Prisma schema & migrations
│   └── test/         # E2E & integration tests (Jest)
├── frontend/         # Next.js App Router application
│   └── app/
├── infrastructure/   # Docker Compose & Dockerfiles
│   └── docker-compose.dev.yml
└── observability/    # Prometheus & Grafana configs
```

---

## 1 — Architecture Principles

### 1.1 Clean / Hexagonal Architecture (Backend)

Every domain module **must** follow a strict three-layer structure:

```
modules/<name>/
  domain/          # Pure TypeScript – NO framework imports
    entities/      # Aggregate roots & value objects
    ports/         # Abstract repository/service interfaces (abstract class)
    events/        # Domain events (plain objects)
  application/     # Use-case orchestration – CQRS only
    commands/      # Immutable command objects
    queries/       # Immutable query objects
    handlers/      # CommandHandler / QueryHandler classes / EventHandler Classes
    ports/         # Application ports (Query Services, Mailer ports)
    dtos/          # Request & Response DTOs (class-validator)
    events/        # Application-level event handlers
  infrastructure/  # Framework & I/O concerns
    adapters/      # Prisma repositories, external API clients
    http/          # Controllers (NestJS)
    strategies/    # Passport strategies
    processors/    # BullMQ processors
    mappers/       # Domain ↔ Persistence mappers
    config/        # Module-scoped config factories
    services/      # Query Services, Cache Decorators, Infrastructure services
```

**Rules:**
- `domain/` must have **zero** imports from `@nestjs/*`, Prisma, or any I/O library.
- Ports are declared as `abstract class` (not `interface`) to allow NestJS DI injection tokens.
- Application handlers must **not** import Prisma types directly; they receive/return domain objects.

### 1.2 CQRS & Query Services Pattern

- Use `@nestjs/cqrs` for **all** state-changing operations (`CommandBus`) and read operations that benefit from explicit intent (`QueryBus`).
- **Write Side (Commands)**: Handlers interact exclusively with domain aggregate roots and repository ports (`DoctorProfileRepositoryPort`).
- **Read Side (Queries)**: Query handlers **must not** query write-repositories directly. They must consume dedicated **Query Services** (`DoctorQueryServicePort`, `SpecialtyQueryServicePort`) located in `application/ports/` and implemented in `infrastructure/services/`.

### 1.3 Caching Decorator Pattern

- Read-side Query Services that require caching **must use the Decorator Pattern** (`CachedSpecialtyQueryService` decorating `SpecialtyQueryServicePort`), injecting NestJS `CACHE_MANAGER` Redis cache with 60s default TTL.
- Command handlers modifying state **must explicitly call `queryService.invalidateCache()`** upon creating, updating, or deleting entities.

### 1.4 Unit of Work & Transactions

- Use `UnitOfWorkInterface` (symbol `UNIT_OF_WORK_INTERFACE`) for cross-repository atomic operations.
- `PrismaUnitOfWork` wraps operations in `prisma.$transaction(async (tx) => { … })`.
- Repositories **inside** a transaction must accept `Prisma.TransactionClient | PrismaService` in their constructors.

### 1.5 Distributed Locking

- Inject `DISTRIBUTED_LOCK_SERVICE_INTERFACE` (provided by `RedisLockModule`) for any operation that must be idempotent across concurrent requests.
- The lock facade uses `SET key identifier EX ttl NX` + a Lua atomic release script — never call `DEL` directly.

---

## 2 — Coding Conventions

### 2.1 Domain Entities

- **Static Factory**: Every domain entity MUST include a `static create(data): Entity` method for controlled instantiation.
- **Mutability**: Identity properties (`id`, `userId`, `createdAt`) are `public readonly`. Updatable domain properties must be `public` (mutable).
- **Domain Methods**: Entities MUST expose explicit domain action/mutation methods (`update(...)`, `verify()`, `unverify()`, `activate()`, `deactivate()`). Never assign properties directly from handlers.
- **Value Objects**: Email fields MUST use the `Email` Value Object (`Email.create(...)`).

### 2.2 Application Handlers (SOLID Rules)

- **Single Responsibility Principle**: Do not condense multiple validation steps into a single monolithic function.
- **Orchestration Pattern**: Keep `execute(command)` high-level and declarative.
- **Private Helper Methods**: Separate distinct validation steps into private async helper methods (e.g. `ensureUserHasNoExistingProfile`, `ensureNameIsUnique`).
- **Parallel Validation**: Independent async validations MUST be parallelized using `Promise.all([ this.funcA(), this.funcB() ])`.
- **Aggregate Root Invariants**: Never bypass aggregate roots with custom DB update methods (e.g. `updateVerificationStatus`). Handlers MUST load the aggregate via `findById`, call domain methods (`profile.verify()`), and save the aggregate with `repository.save(profile)`.

### 2.3 Persistence Mappers

- Repositories (`save()`) MUST NOT construct inline Prisma create/update objects.
- All Mappers (`UserMapper`, `DoctorProfileMapper`, `SpecialtyMapper`) MUST expose `static toCreateInput(...)` and `static toUpdateInput(...)` methods.

### 2.4 DTOs, Pagination & Validation

- All request DTOs live in `application/dtos/` and use `class-validator` decorators.
- All response DTOs use `@ApiProperty()` from `@nestjs/swagger` with realistic `example` values.
- **Pagination Standard**: Always use `perPage` instead of `limit` for pagination parameters across DTOs, queries, handlers, and repositories.
- Never expose internal domain objects or Prisma models directly from controllers.

### 2.5 Naming Conventions

| Artifact | Pattern | Example |
|---|---|---|
| Command | `<Action><Context>Command` | `LoginCommand` |
| CommandHandler | `<Action><Context>Handler` | `LoginHandler` |
| Query | `Get<Context>Query` | `GetDoctorsQuery` |
| QueryHandler | `Get<Context>Handler` | `GetDoctorsHandler` |
| Repository Port | `<Entity>RepositoryPort` | `UserRepositoryPort` |
| Query Service Port | `<Entity>QueryServicePort` | `SpecialtyQueryServicePort` |
| Prisma Adapter | `Prisma<Entity>Repository` | `PrismaUserRepository` |
| Caching Decorator | `Cached<Entity>QueryService` | `CachedSpecialtyQueryService` |
| DTO (Request) | `<Action>ReqDto` | `LoginReqDto` |
| DTO (Response) | `<Action>ResDto` | `LoginResDto` |
| Module | `<Context>Module` | `AuthModule` |
| Controller | `<Context>Controller` | `AuthController` |

### 2.6 File Structure Conventions

- One class per file.
- File names use `kebab-case` with a descriptive suffix: `.entity.ts`, `.command.ts`, `.handler.ts`, `.port.ts`, `.adapter.ts`, `.controller.ts`, `.module.ts`, `.dto.ts`.
- Path alias `@/` maps to `backend/src/`. Use it for all intra-project imports.
- Generated Prisma client is at `generated/prisma/client`; import as `import { PrismaClient } from '@/../generated/prisma/client'`.

---

## 3 — Database & Prisma

- The Prisma schema lives at `backend/prisma/schema.prisma`. Output is `../generated/prisma`.
- Use `PrismaPg` adapter (Node.js `pg` pool) instead of the default Rust engine — **never** revert this.
- Pool configuration: `max: 85`, `connectionTimeoutMillis: 5000`, `idleTimeoutMillis: 10000`. Justify any change.
- Migrations must be run via `prisma migrate dev`; never apply schema changes with `db push` in production.
- DB models use `snake_case` column names via `@map()`. Domain entities use `camelCase` properties — mappers bridge both worlds.

### Domain Entities (key models)

| Model | Notes |
|---|---|
| `User` | Roles: `ADMIN`, `DOCTOR`, `PATIENT`. Has MFA, refresh tokens, doctor profile relation. |
| `DoctorProfile` | One-to-one with `User`. Stores license, bio, fee, avatar, specialties. |
| `Specialty` | Medical specialty catalog (name, slug with diacritics stripping, description, icon, image, isActive). |
| `Appointment` | Links patient & doctor `User`s. Status enum: `PENDING → CONFIRMED → COMPLETED/CANCELLED/NO_SHOW`. |
| `ScheduleRules` | Weekly recurring availability slots per doctor (day, HH:mm range, duration, buffer). |
| `ScheduleAbsences` | Doctor absence windows that override `ScheduleRules`. |
| `RefreshToken` | Stored hashed; linked to `User` with expiry. |
| `MfaBackupCodes` | One-time use codes; stored hashed. |

---

## 4 — Authentication & Security

- JWT tokens are sent/received via **HttpOnly cookies** (not Authorization headers) to prevent XSS token theft.
  - `accessToken` cookie: 1 hour TTL.
  - `refreshToken` cookie: longer TTL, rotated on refresh.
- MFA is TOTP-based via `otplib`. The flow is: `setup → challenge → activate`. Deactivation requires an authenticated session.
- Backup codes are hashed before storage; each code is single-use.
- Password reset tokens are hashed (stored in `passwordResetToken`) with an expiry (`passwordResetExpiresAt`).
- The `@Public()` decorator exempts an endpoint from the JWT guard.
- Role-based authorization is enforced via `@Roles(UserRole.ADMIN, UserRole.DOCTOR)` decorator and `RolesGuard`.

---

## 5 — Caching (Redis)

- Two distinct Redis integrations exist; do not conflate them:
  1. **`RedisCacheModule`** — NestJS `@nestjs/cache-manager` with `@keyv/redis`. Inject `CACHE_MANAGER` token. Default TTL: 60 s. Has exponential reconnect strategy.
  2. **`RedisLockModule`** — `@liaoliaots/nestjs-redis` + `RedisLockFacade` for distributed locks. Inject `DISTRIBUTED_LOCK_SERVICE_INTERFACE`.
- Both modules are global; import them only in `AppModule`.

---

## 6 — Testing & Test Factories

- **Unit tests**: `*.spec.ts` alongside source files. Run with `pnpm test`.
- **E2E tests**: `backend/test/**/*.e2e-spec.ts`. Run with `pnpm test:e2e` inside Docker container (`docker exec md_nestjs npm run test:e2e`).
- **Test Factories Pattern**: Every domain entity MUST have a builder in `test/factories/` registered in `TestFactories` (`TestFactories.user()`, `TestFactories.doctorProfile()`, `TestFactories.specialty()`).
- E2E tests MUST use `TestFactories` to create test fixtures rather than direct `prisma.model.create(...)` calls.
- E2E tests use `supertest` against a real NestJS application bootstrapped with `@nestjs/testing`.

---

## 7 — Agent Behavioral Rules

1. **Read before writing.** Always inspect existing code in the relevant module before creating new files.
2. **Respect layer boundaries.** Never import infrastructure concerns into the domain layer.
3. **Prefer extension over modification.** Add new handlers/commands/ports without altering existing stable contracts.
4. **Test coverage required.** Every new command handler must have at minimum one E2E test covering the happy path.
5. **No magic strings.** Use enums (e.g., `UserRole`, `AppointmentStatus`) and DI token symbols — never raw string literals for roles or token names.
6. **Document ports.** New abstract port classes must include a JSDoc comment describing the contract.
7. **Validate DTOs.** Every request DTO must use `class-validator` decorators. Never trust raw user input.
8. **Security by default.** New endpoints are authenticated by default. Explicitly add `@Public()` only if the business requirement demands it and document the reason.
9. **Use Mappers and Query Services.** Always delegate Prisma payload creation to Mappers (`toCreateInput`/`toUpdateInput`) and read queries to Query Services.
10. **Use TestFactories.** E2E tests must always construct test fixtures using `TestFactories.<entity>()`.
11. **Ask before breaking.** If a change requires modifying a shared interface (port, UoW, shared module), surface the impact and ask for confirmation before proceeding.

