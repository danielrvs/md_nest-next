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
│   │   ├── modules/  # Domain modules (auth, users, …)
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
    dtos/          # Request & Response DTOs (class-validator)
    events/        # Application-level event handlers
  infrastructure/  # Framework & I/O concerns
    adapters/      # Prisma repositories, external API clients
    http/          # Controllers (NestJS)
    strategies/    # Passport strategies
    processors/    # BullMQ processors
    mappers/       # Domain ↔ Persistence mappers
    config/        # Module-scoped config factories
    services/      # Services definitions related to infrastructure as query services
```

**Rules:**
- `domain/` must have **zero** imports from `@nestjs/*`, Prisma, or any I/O library.
- Ports are declared as `abstract class` (not `interface`) to allow NestJS DI injection tokens.
- Application handlers must **not** import Prisma types directly; they receive/return domain objects.

### 1.2 CQRS Pattern

- Use `@nestjs/cqrs` for **all** state-changing operations (`CommandBus`) and read operations that benefit from explicit intent (`QueryBus`).
- Commands are plain, immutable TS classes (readonly properties, no decorators).
- Handlers are decorated with `@CommandHandler(MyCommand)` or `@QueryHandler(MyQuery)`.
- Events are dispatched via `EventBus`; handlers are decorated with `@EventsHandler(MyEvent)`.

### 1.3 Unit of Work & Transactions

- Use `UnitOfWorkInterface` (symbol `UNIT_OF_WORK_INTERFACE`) for cross-repository atomic operations.
- `PrismaUnitOfWork` wraps operations in `prisma.$transaction(async (tx) => { … })`.
- Repositories **inside** a transaction must accept `Prisma.TransactionClient | PrismaService` in their constructors.

### 1.4 Distributed Locking

- Inject `DISTRIBUTED_LOCK_SERVICE_INTERFACE` (provided by `RedisLockModule`) for any operation that must be idempotent across concurrent requests.
- The lock facade uses `SET key identifier EX ttl NX` + a Lua atomic release script — never call `DEL` directly.

---

## 2 — Coding Conventions

### 2.1 TypeScript

- **Strict mode** is enabled (`strict: true`). Never use `any` without an explicit `// eslint-disable` comment explaining the justification.
- Prefer `unknown` over `any` for error catches; narrow types before use.
- Use `readonly` for entity constructor parameters and command properties.
- Value Objects (VOs) live in `domain/entities/vo/` and encapsulate validation logic internally.

### 2.2 NestJS

- Use **constructor injection** only; avoid property injection (`@Inject()` on fields).
- Register module-wide DI tokens as `{ provide: MyPort, useClass: MyAdapter }` inside the module's `providers` array.
- Mark modules as `@Global()` only when truly cross-cutting (e.g., `PrismaModule`, `RedisCacheModule`, `RedisLockModule`).
- Controllers must be thin: dispatch commands/queries, set HTTP cookies/status, and return DTOs. No business logic.
- Use the `@Public()` decorator for unauthenticated endpoints; the JWT guard is applied globally.
- Rate limiting is enforced globally via `CustomThrottlerGuard`; do not bypass it without justification.

### 2.3 DTOs & Validation

- All request DTOs live in `application/dtos/` and use `class-validator` decorators.
- All response DTOs use `@ApiProperty()` from `@nestjs/swagger` with realistic `example` values.
- Never expose internal domain objects or Prisma models directly from controllers.
- Use `@Expose()` + `plainToInstance()` for controlled serialization.

### 2.4 Error Handling

- Throw NestJS `HttpException` subclasses **only from controllers or application handlers** (not from domain entities or ports).
- Domain-level invariant violations should throw plain `Error` subclasses and be caught/translated at the application layer.
- The `RedisLockFacade` throws `ConflictException` (409) when a lock cannot be acquired.

### 2.5 Naming Conventions

| Artifact | Pattern | Example |
|---|---|---|
| Command | `<Action><Context>Command` | `LoginCommand` |
| CommandHandler | `<Action><Context>Handler` | `LoginHandler` |
| Repository Port | `<Entity>RepositoryPort` | `UserRepositoryPort` |
| Prisma Adapter | `Prisma<Entity>Repository` | `PrismaUserRepository` |
| DTO (Request) | `<Action>ReqDto` | `LoginReqDto` |
| DTO (Response) | `<Action>ResDto` | `LoginResDto` |
| Module | `<Context>Module` | `AuthModule` |
| Controller | `<Context>Controller` | `AuthController` |

### 2.6 File Structure Conventions

- One class per file.
- File names use `kebab-case` with a descriptive suffix: `.entity.ts`, `.command.ts`, `.handler.ts`, `.port.ts`, `.adapter.ts`, `.controller.ts`, `.module.ts`, `.dto.ts`.
- Path alias `@/` maps to `backend/src/`. Use it for all intra-project imports (never relative `../../..` beyond two levels, and avoid as possible).
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

---

## 5 — Messaging (RabbitMQ & BullMQ)

- **RabbitMQ** (`@golevelup/nestjs-rabbitmq`) is the inter-service event bus for domain events.
- Processors live in `infrastructure/processors/` and must be decorated with `@Processor('queue-name')`.
- Event handlers that send emails must enqueue jobs to BullMQ — never call the mailer synchronously from a handler.

---

## 6 — Caching (Redis)

- Two distinct Redis integrations exist; do not conflate them:
  1. **`RedisCacheModule`** — NestJS `@nestjs/cache-manager` with `@keyv/redis`. Inject `CACHE_MANAGER` token. Default TTL: 60 s. Has exponential reconnect strategy.
  2. **`RedisLockModule`** — `@liaoliaots/nestjs-redis` + `RedisLockFacade` for distributed locks. Inject `DISTRIBUTED_LOCK_SERVICE_INTERFACE`.
- Both modules are global; import them only in `AppModule`.

---

## 7 — Testing

- **Unit tests**: `*.spec.ts` alongside source files. Run with `pnpm test`.
- **E2E tests**: `backend/test/**/*.e2e-spec.ts`. Run with `pnpm test:e2e`. Use a separate test DB (`.env.test`).
- Use the `TestFactories` pattern (see KI: *NestJS Test Factory Pattern*) for creating test fixtures with Prisma.
- E2E tests use `supertest` against a real NestJS application bootstrapped with `@nestjs/testing`.
- Test commands run via `env-cmd -f .env.test` to load the test environment.
- Mock external ports (mailer, MFA generator) using `jest.fn()` or `{ provide: Port, useValue: mockObject }`.

---

## 8 — Frontend (Next.js)

- Uses **App Router** (not Pages Router). All routes live under `frontend/app/`.
- Styled with **Tailwind CSS v4**. Do not introduce other CSS frameworks.
- Fetch data using React Server Components where possible; use client components only for interactivity.
- Use shadcnui components only.
- API calls go to `http://localhost:3000` (backend) in development.

---

## 9 — Infrastructure & DevOps

- All services are defined in `infrastructure/docker-compose.dev.yml`.
- Start the full stack with `./start.sh`; stop with `./stop.sh` from the project root.
- The backend container mounts `../backend` as a volume for hot-reload.
- Never commit `.env` files with real secrets. Use the `.env.example` pattern.
- Prisma schema changes require running `pnpm test:db:push` (against the test DB) before writing E2E tests.

---

## 10 — Agent Behavioral Rules

1. **Read before writing.** Always inspect existing code in the relevant module before creating new files.
2. **Respect layer boundaries.** Never import infrastructure concerns into the domain layer.
3. **Prefer extension over modification.** Add new handlers/commands/ports without altering existing stable contracts.
4. **Test coverage required.** Every new command handler must have at minimum one E2E test covering the happy path.
5. **No magic strings.** Use enums (e.g., `UserRole`, `AppointmentStatus`) and DI token symbols — never raw string literals for roles or token names.
6. **Document ports.** New abstract port classes must include a JSDoc comment describing the contract.
7. **Validate DTOs.** Every request DTO must use `class-validator` decorators. Never trust raw user input.
8. **Security by default.** New endpoints are authenticated by default. Explicitly add `@Public()` only if the business requirement demands it and document the reason.
9. **Consult KIs.** Before implementing cross-cutting patterns (guards, validation, test factories), check the Knowledge Items in the knowledge base for established patterns.
10. **Ask before breaking.** If a change requires modifying a shared interface (port, UoW, shared module), surface the impact and ask for confirmation before proceeding.
