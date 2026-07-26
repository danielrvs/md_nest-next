# SPECS.md — Directorio Médico Enterprise (MD Nest-Next)

> Technical specification document for the medical directory and health portal platform.

---

## 1. Product Vision

A high-performance, decoupled medical directory platform that enables:
- **Patients** to discover and book appointments with doctors by specialty, location, and availability.
- **Doctors** to manage their profiles, availability schedules, and patient appointments.
- **Admins** to verify doctors, manage specialties, and oversee the platform.

The platform supersedes a legacy WordPress installation, offering an API-first architecture, real-time availability, and enterprise-grade scalability.

---

## 2. System Architecture

```
┌──────────────────────────────────────────────────────────┐
│                        CLIENT                            │
│              Next.js 16 (App Router, React 19)           │
│                   Tailwind CSS v4                        │
│                  localhost:3002 (dev)                    │
└──────────────────────┬───────────────────────────────────┘
                       │ HTTPS / Cookie Auth
┌──────────────────────▼───────────────────────────────────┐
│                        API SERVER                        │
│                NestJS 11 / Node.js 24                    │
│         Clean Architecture + CQRS + Hexagonal            │
│                   localhost:3000 (dev)                   │
└─────┬──────────┬──────────┬──────────┬───────────────────┘
      │          │          │          │
  ┌───▼──┐  ┌───▼──┐  ┌────▼───┐  ┌───▼──────┐
  │  PG  │  │Redis │  │RabbitMQ│  │  MinIO   │
  │  18  │  │  8   │  │        │  │  (S3)    │
  └──────┘  └──────┘  └────────┘  └──────────┘
      │
  ┌───▼──────────┐
  │  Prometheus  │──── Grafana (localhost:3003)
  │ (localhost:  │
  │    9090)     │
  └──────────────┘
```

### Architectural Pattern: Clean / Hexagonal Architecture

```
Domain Layer (innermost)
  └── Entities, Value Objects, Ports (abstract contracts)
        ↑ depends on nothing

Application Layer
  └── Commands, Queries, Handlers, DTOs
        ↑ depends only on Domain

Infrastructure Layer (outermost)
  └── Prisma adapters, HTTP controllers, Passport strategies,
      BullMQ processors, external service adapters
        ↑ depends on Application + Domain
```

---

## 3. Technology Stack

### Backend

| Technology | Version | Purpose |
|---|---|---|
| Node.js | 24 | Runtime |
| NestJS | 11 | Server framework |
| TypeScript | 5.7 | Language |
| Prisma | 7 | ORM + migrations |
| `@prisma/adapter-pg` | 7 | Node.js pg pool adapter (replaces Rust driver) |
| `@nestjs/cqrs` | 11 | Command/Query/Event Bus |
| `@nestjs/passport` + `passport-jwt` | — | JWT authentication |
| `@nestjs/bullmq` | — | Async job processing |
| `@golevelup/nestjs-rabbitmq` | 9 | RabbitMQ integration |
| `@nestjs/cache-manager` + `@keyv/redis` | — | Distributed cache |
| `@liaoliaots/nestjs-redis` + `ioredis` | — | Distributed locks |
| `otplib` | 13 | TOTP / MFA |
| `bcrypt` | 6 | Password hashing |
| `class-validator` / `class-transformer` | — | DTO validation |
| `@nestjs/swagger` | 11 | OpenAPI docs |
| `@nestjs/throttler` | 6 | Rate limiting |
| `cookie-parser` | — | HttpOnly cookie handling |

### Frontend

| Technology | Version | Purpose |
|---|---|---|
| Next.js | 16 | React framework (App Router) |
| React | 19 | UI library |
| Tailwind CSS | v4 | Utility-first styling |
| TypeScript | 5 | Language |

### Infrastructure

| Service | Image | Port | Purpose |
|---|---|---|---|
| PostgreSQL | `postgres:18-alpine` | 5432 | Primary database |
| Redis | `redis:8.4.4-alpine3.22` | 6379 | Cache + distributed locks |
| RabbitMQ | `rabbitmq:3-management-alpine` | 5672 / 15672 | Message broker |
| MinIO | `minio/minio:latest` | 9000 / 9001 | S3-compatible object storage |
| Mailpit | `axllent/mailpit` | 1025 / 8025 | SMTP dev mail server |
| Prometheus | `prom/prometheus:latest` | 9090 | Metrics collection |
| Grafana | `grafana/grafana:latest` | 3003 | Metrics visualization |

---

## 4. Data Model

### 4.1 Entity Relationship Overview

```
User ─────────────── DoctorProfile ──── DoctorsSpecialties ──── Specialty
  │                       │
  ├── RefreshToken         └── (via userId link)
  ├── MfaBackupCodes
  ├── ScheduleRules
  ├── ScheduleAbsences
  ├── Appointment (as patient)
  └── Appointment (as doctor)
```

### 4.2 User

| Field | Type | Notes |
|---|---|---|
| `id` | UUID | PK |
| `email` | String (unique) | Validated by `Email` VO |
| `name` | String | Display name |
| `phoneNumber` | String? (unique) | Optional |
| `role` | `UserRole` enum | `ADMIN \| DOCTOR \| PATIENT` |
| `password` | String? | bcrypt hash |
| `passwordResetToken` | String? | bcrypt hash of reset token |
| `passwordResetExpiresAt` | DateTime? | Token expiry |
| `mfaSecret` | String? | TOTP secret (otplib) |
| `mfaFactorConfirmedAt` | DateTime? | Timestamp of MFA activation |
| `emailVerified` | DateTime? | Timestamp of email verification |
| `isActive` | Boolean | Soft-disable flag |

### 4.3 DoctorProfile

| Field | Type | Notes |
|---|---|---|
| `id` | UUID | PK |
| `userId` | UUID (unique FK) | One-to-one with `User` |
| `licenseNumber` | String (unique) | Medical licence |
| `bio` | String? | Free text |
| `consultationFee` | Decimal(10,2)? | In platform currency |
| `isVerified` | Boolean | Admin-verified flag |
| `avatar` | String? | MinIO object URL |

### 4.4 Appointment

| Field | Type | Notes |
|---|---|---|
| `id` | UUID | PK |
| `title` | String | Visit reason |
| `description` | String? | Detail |
| `status` | `AppointmentStatus` | `PENDING \| CONFIRMED \| CANCELLED \| COMPLETED \| NO_SHOW` |
| `startTime` | DateTime | Slot start |
| `endTime` | DateTime | Slot end |
| `patientId` | UUID FK | → `User` |
| `doctorId` | UUID FK | → `User` |

**Indexes:** `(doctorId, startTime, endTime)`, `(patientId, startTime)`, `(status)`.

### 4.5 ScheduleRules

Weekly recurring availability defined per doctor.

| Field | Type | Notes |
|---|---|---|
| `dayOfWeek` | Int | 1 = Monday … 7 = Sunday |
| `startTime` | String | `"HH:mm"` |
| `endTime` | String | `"HH:mm"` |
| `slotDuration` | Int | Minutes per slot |
| `bufferTime` | Int | Buffer between slots (minutes) |

### 4.6 ScheduleAbsences

Overrides `ScheduleRules` for specific date ranges (vacations, events).

---

## 5. API Endpoints

### 5.1 Authentication (`/auth`)

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/auth/register` | Public | Register a new user. Returns `UserResDto`. |
| `POST` | `/auth/login` | Public | Credential login. Sets `accessToken` + `refreshToken` cookies. Returns `LoginResDto` or `MFALoginResDto` (202). |
| `POST` | `/auth/logout` | JWT | Clears cookies, invalidates refresh token. |
| `POST` | `/auth/forgot-password` | Public | Sends password reset email via BullMQ queue. |
| `POST` | `/auth/reset-password` | Public | Validates token, sets new password. |

### 5.2 MFA (`/mfa`)

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/mfa/setup` | JWT | Generates TOTP secret + QR code. |
| `POST` | `/mfa/challenge` | MFA Token Cookie | Validates TOTP code; issues full session tokens. |
| `POST` | `/mfa/activate` | JWT | Confirms TOTP secret; generates backup codes. |
| `POST` | `/mfa/deactivate` | JWT | Disables MFA, deletes backup codes. |

### 5.3 Planned Endpoints (Roadmap)

| Domain | Endpoints |
|---|---|
| Users | `GET /users/me`, `PATCH /users/me` |
| Doctors | `GET /doctors`, `GET /doctors/:id`, `POST /doctors/profile`, `PATCH /doctors/profile` |
| Specialties | `GET /specialties`, `POST /specialties` (Admin) |
| Appointments | `POST /appointments`, `GET /appointments/me`, `PATCH /appointments/:id/status` |
| Schedule | `POST /schedule/rules`, `POST /schedule/absences`, `GET /schedule/:doctorId/availability` |
| Media | `POST /upload/avatar` |

---

## 6. Authentication & Security Specification

### Token Flow

```
1. POST /auth/login
   ← 200 OK + Set-Cookie: accessToken (1h, HttpOnly, Secure, SameSite=Lax)
            + Set-Cookie: refreshToken (HttpOnly, Secure, SameSite=Lax)

2. Subsequent requests: cookies sent automatically by browser

3. POST /auth/logout
   ← 204 No Content + Clear-Cookie: accessToken, refreshToken
```

### MFA TOTP Flow

```
1. POST /mfa/setup     → { secret, otpauthUrl, qrCode }
2. POST /mfa/activate  → { backupCodes[] }       (confirms secret)
3. POST /auth/login    → 202 + Set-Cookie: mfaToken
4. POST /mfa/challenge { code } → 200 + full session cookies
```

### Security Measures

- Passwords hashed with `bcrypt` (cost factor ≥ 10).
- Reset tokens hashed before storage; expire after configurable TTL.
- Rate limiting on all endpoints via `@nestjs/throttler` (`CustomThrottlerGuard`).
- JWT guard applied globally; routes opt-out with `@Public()`.
- Cookies: `httpOnly: true`, `secure: true`, `sameSite: 'lax'`.
- Distributed lock (`RedisLockFacade`) prevents concurrent duplicate operations on critical paths.

---

## 7. Async Processing Specification

### Email Queue (`auth-emails` — BullMQ)

| Job | Trigger | Processor |
|---|---|---|
| `send-welcome` | `UserRegisteredEvent` | `MailProcessor` |
| `send-password-reset` | `ForgotPasswordEvent` | `MailProcessor` |
| `send-password-changed` | `ResetPasswordEvent` | `MailProcessor` |

**Mail transport**: SMTP via Mailpit (dev) / configurable provider (prod).

### RabbitMQ (Inter-Service Events — Planned)

Future domain events (appointment booked, doctor verified) will be published to RabbitMQ exchanges for potential microservice consumption.

---

## 8. Caching Specification

### Cache Layer 1 — General Cache (`RedisCacheModule`)

- **Library**: `@nestjs/cache-manager` + `@keyv/redis`
- **Default TTL**: 60 seconds
- **Use cases**: Specialty listings, public doctor directory pages, frequently read reference data.
- **Reconnect strategy**: exponential backoff `min(retries * 100ms, 2000ms)`.

### Cache Layer 2 — Distributed Lock (`RedisLockModule`)

- **Library**: `@liaoliaots/nestjs-redis` + `ioredis`
- **Mechanism**: `SET key uuid EX ttl NX` + Lua atomic release.
- **Use cases**: Appointment booking (prevent double-booking same slot), password reset token issuance.
- **Failure mode**: `ConflictException` (HTTP 409) when lock is already held.

---

## 9. Infrastructure & Operations

### Connection Pool (Fail-Fast Architecture)

```
PostgreSQL connection pool (PrismaPg + pg)
  max connections:      85
  connectionTimeout:    5,000 ms   ← fail fast under load
  idleTimeout:          10,000 ms
```

**Rationale**: Under traffic spikes, a low `connectionTimeoutMillis` (5 s) prevents Node.js heap exhaustion by rejecting new connections quickly ("fail fast") instead of queuing indefinitely.

### Service Health Checks

| Service | Check |
|---|---|
| PostgreSQL | `pg_isready` every 5 s, 5 retries |
| Redis | `redis-cli ping` every 5 s, 5 retries |

Backend and frontend containers start only when DB and Redis are healthy.

### Observability

- **Prometheus** scrapes metrics from the NestJS backend at `/metrics`.
- **Grafana** dashboards visualize request rates, DB pool usage, queue depths, and error rates.

---

## 10. Project Roadmap

### Phase 1 — Core Auth ✅ (Implemented)
- [x] User registration with email verification flow
- [x] Credential login with HttpOnly cookies
- [x] JWT authentication (global guard)
- [x] Refresh token rotation
- [x] TOTP MFA (setup, challenge, activate, deactivate, backup codes)
- [x] Forgot/reset password via email queue
- [x] Rate limiting

### Phase 2 — Medical Directory (In Progress)
- [ ] Doctor profile CRUD
- [ ] Specialty management (Admin)
- [ ] Doctor search & filtering (by specialty, location, availability)
- [ ] Avatar upload (MinIO)

### Phase 3 — Appointment System
- [ ] Schedule rules management per doctor
- [ ] Schedule absences (override windows)
- [ ] Real-time availability calculation
- [ ] Appointment booking with distributed lock (prevent double-booking)
- [ ] Appointment status lifecycle management

### Phase 4 — Async & Scale
- [ ] RabbitMQ domain event publishing
- [ ] Appointment confirmation/cancellation notifications
- [ ] E2E test coverage expansion
- [ ] Performance benchmarking under concurrent load

---

## 11. Development Workflow

### Local Environment

```bash
# Start all Docker services
./start.sh

# Backend dev server (hot-reload)
cd backend && pnpm run start:dev

# Frontend dev server
cd frontend && pnpm run dev

# Run E2E tests
cd backend && pnpm test:e2e

# Apply schema to test DB
cd backend && pnpm test:db:push
```

### Service URLs

| Service | URL |
|---|---|
| Frontend | http://localhost:3002 |
| Backend API | http://localhost:3000 |
| Swagger Docs | http://localhost:3000/api |
| MinIO Console | http://localhost:9001 |
| Mailpit UI | http://localhost:8025 |
| RabbitMQ Admin | http://localhost:15672 |
| Prometheus | http://localhost:9090 |
| Grafana | http://localhost:3003 |
