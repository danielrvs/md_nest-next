# Directorio Médico Enterprise (MD Nest-Next)

Este repositorio contiene una plataforma moderna, desacoplada y de alto rendimiento para la gestión y búsqueda de un directorio médico, junto con un portal de noticias/blog especializado en salud. La arquitectura anterior basada en WordPress ha sido migrada a un stack moderno y desacoplado utilizando un backend en **NestJS** y un frontend en **Next.js**.

---

## 🚀 Arquitectura y Tecnologías

La infraestructura del proyecto está completamente dockerizada y estructurada bajo una arquitectura multinodo que incluye los siguientes servicios:

*   **Backend**: **NestJS 11** corriendo sobre **Node.js 24** (TypeScript), estructurado bajo **Clean Architecture / Hexagonal + CQRS** y utilizando **Prisma ORM** para el acceso a datos.
*   **Frontend**: **Next.js 16** (React 19) estructurado bajo App Router y estilado con **Tailwind CSS v4**.
*   **Base de datos**: **PostgreSQL 18** (Alpine) administrado de forma segura y optimizada (Connection Pool fail-fast).
*   **Caché y Almacenamiento Key-Value**: **Redis 8.4** integrado mediante la API global de Cache de NestJS (`@nestjs/cache-manager` con adaptador `Keyv`) aplicando el **Patrón Decorador** para almacenamiento en caché transparente e invalidación automática.
*   **Gestor de Colas (Mensajería)**: **RabbitMQ** para procesamiento asíncrono y comunicación basada en eventos.
*   **Almacenamiento de Objetos (S3 compatible)**: **MinIO** para la gestión de media, archivos adjuntos de historiales o imágenes de médicos.
*   **Servidor de Correo de Pruebas**: **Mailpit** para interceptar y validar el envío de emails durante el desarrollo (notificaciones de citas, etc.).
*   **Observabilidad**: Stack de monitorización compuesto por **Prometheus** (recolección de métricas) y **Grafana** (visualización).

---

## 🛠️ Requisitos Previos

*   [Docker](https://www.docker.com/) instalado en tu sistema.
*   [Docker Compose](https://docs.docker.com/compose/) instalado.
*   [pnpm](https://pnpm.io/) (recomendado) para la gestión local de dependencias.

---

## 🏁 Configuración e Inicio

### 1. Levantar el entorno Docker local
El proyecto dispone de scripts para orquestar la suite completa de contenedores de Docker. En la raíz del repositorio, ejecuta:

```bash
./start.sh
```

Este script leerá el archivo `.env` en la raíz (que define el entorno como `dev`) y levantará en segundo plano todos los servicios descritos en `infrastructure/docker-compose.dev.yml`.

Para detener el entorno completo, ejecuta:
```bash
./stop.sh
```

### 2. Desarrollo Local de Aplicaciones

Aunque los contenedores están configurados para correr los servicios, puedes ejecutar el backend y frontend localmente en modo desarrollo para aprovechar un feedback loop más rápido.

#### Backend (NestJS)
1. Entra al directorio `backend`:
   ```bash
   cd backend
   ```
2. Instala las dependencias:
   ```bash
   pnpm install
   ```
3. Ejecuta el servidor en modo watch:
   ```bash
   pnpm run start:dev
   ```
4. Ejecutar la suite de pruebas E2E dentro del contenedor Docker:
   ```bash
   docker exec md_nestjs npm run test:e2e
   ```

#### Frontend (Next.js)
1. Entra al directorio `frontend`:
   ```bash
   cd frontend
   ```
2. Instala las dependencias:
   ```bash
   pnpm install
   ```
3. Ejecuta el servidor de desarrollo:
   ```bash
   pnpm run dev
   ```

---

## 🔗 Puertos y Direcciones de Interés

Una vez levantado el entorno con `./start.sh`, los servicios quedan expuestos en los siguientes puertos de tu máquina local:

| Servicio | URL / Puerto | Descripción |
| :--- | :--- | :--- |
| **Frontend (Next.js)** | [http://localhost:3002](http://localhost:3002) | Aplicación cliente para los usuarios y pacientes. |
| **Backend (NestJS)** | [http://localhost:3000](http://localhost:3000) | API REST y WebSocket. Documentación Swagger en `/api/docs`. |
| **MinIO Console** | [http://localhost:9001](http://localhost:9001) | Panel de administración de archivos (S3 local). API en puerto `9000`. |
| **Mailpit Web UI** | [http://localhost:8025](http://localhost:8025) | Bandeja de entrada para visualizar los correos salientes del sistema (SMTP en `1025`). |
| **RabbitMQ Admin** | [http://localhost:15672](http://localhost:15672) | Consola de gestión de colas y exchanges. Protocolo AMQP en `5672`. |
| **Prometheus** | [http://localhost:9090](http://localhost:9090) | Servidor de series temporales de monitorización. |
| **Grafana** | [http://localhost:3003](http://localhost:3003) | Dashboards y métricas del sistema. |

---

## 📁 Estructura del Proyecto

```text
├── backend/                     # Servidor backend en NestJS
│   ├── src/
│   │   ├── modules/             # Módulos del dominio (auth, users, doctors, specialties)
│   │   │   ├── auth/            # Autenticación JWT, MFA TOTP, Recuperación de contraseña
│   │   │   ├── users/           # Entidad y repositorio de Usuarios
│   │   │   ├── doctors/         # Gestión de Perfiles Médicos [BE-DOC-01] & Search Query Service
│   │   │   └── specialties/     # Catálogo de Especialidades Médicas [BE-DOC-02] & Redis Cache Decorator
│   │   └── shared/              # Recursos compartidos e infraestructura (Prisma, Redis Cache, Guards, Roles)
│   └── test/                    # Tests unitarios y suite E2E con TestFactories
├── frontend/                    # Servidor frontend en Next.js (App Router)
│   ├── app/                     # Páginas y componentes del sitio
│   └── public/                  # Assets estáticos
├── infrastructure/              # Configuración de Docker y provisionamiento
│   ├── backend/                 # Dockerfile de desarrollo de NestJS
│   ├── frontend/                # Dockerfile de desarrollo de Next.js
│   └── docker-compose.dev.yml   # Orquestador de la infraestructura local
├── observability/               # Configuraciones de monitorización (Prometheus, Grafana)
├── start.sh                     # Script Bash de inicio rápido
├── stop.sh                      # Script Bash para detener contenedores
└── README.md                    # Documentación principal del proyecto
```

---

## ⚡ Patrones de Arquitectura y Diseño Aplicados

El proyecto implementa rigurosamente los patrones de diseño y arquitectura de software más robustos para aplicaciones enterprise:

### 1. Clean Architecture / Hexagonal Architecture (Ports & Adapters)
Cada módulo del backend desacopla estrictamente sus tres capas principales:
* **Dominio (`domain/`)**: Contiene la lógica central y reglas de negocio puras (`DoctorProfile`, `Specialty`, `User`). Es 100% independiente de frameworks, bases de datos o librerías de I/O.
* **Aplicación (`application/`)**: Orquesta los casos de uso a través de comandos, consultas, DTOs de request/response y puertos (interfaces declaradas como `abstract class`).
* **Infraestructura (`infrastructure/`)**: Implementa los adaptadores concretos (Prisma, Redis, NestJS Controllers, Passport Strategies, Mailers).

### 2. Repository Pattern (Puertos y Adaptadores para Persistencia de Datos)
Abstracción de la persistencia de datos mediante la separación de responsabilidades:
* **Puertos de Repositorio (`domain/ports/`)**: Declarados como `abstract class` (`UserRepositoryPort`, `DoctorProfileRepositoryPort`, `SpecialtyRepositoryPort`) extendiendo la interfaz genérica `IsFactoryRepository<T>` para permitir la inyección de dependencias en NestJS.
* **Adaptadores de Repositorio (`infrastructure/adapters/`)**: Implementaciones concretas (`PrismaUserRepository`, `PrismaDoctorProfileRepository`, `PrismaSpecialtyRepository`) que traducen las consultas a Prisma ORM.

### 3. CQRS (Command Query Responsibility Segregation)
Separación estricta entre operaciones que cambian el estado y operaciones de lectura:
* **Write Side (Commands)**: Gestionados a través del `CommandBus` (`CreateDoctorProfileCommand`, `CreateSpecialtyCommand`), interactúan únicamente con repositorios de dominio y agregados completos.
* **Read Side (Queries)**: Gestionados a través del `QueryBus` (`GetDoctorsQuery`, `GetSpecialtiesQuery`), consumen servicios de consulta dedicados para la vista.

### 4. Query Service Pattern (Read Side Desacoplado)
* Las lecturas intensivas y paginadas (`GET /doctors`) utilizan **Query Services** especializados (`DoctorQueryServicePort` / `PrismaDoctorQueryService`), optimizados para búsquedas rápidas, proyecciones en DTOs y paginación (`perPage`), evitando la hidratación innecesaria de agregados de escritura.

### 5. Decorator Pattern para Caché en Redis (`[BE-DOC-02]`)
* Para evitar contaminar el adaptador primario de base de datos con lógica de caché, se implementa `CachedSpecialtyQueryService` que **decora** el servicio primario (`PrismaSpecialtyQueryService`). Intercepta lecturas públicas en Redis (`specialties:active`, 60s TTL) y expone un método de invalidación invocado automáticamente por los handlers de mutación (`POST`, `PATCH`, `DELETE`).

### 6. Single Responsibility Principle (SRP) & Orchestration Pattern
* Los handlers de comandos (`CreateDoctorProfileHandler`, `CreateSpecialtyHandler`) delegan cada validación de unicidad en métodos privados asíncronos independientes (`ensureNameIsUnique`, `ensureSlugIsUnique`, `ensureUserHasNoExistingProfile`), orquestados concurrentemente mediante `Promise.all`.

### 7. Value Object (VO) Pattern
* Encapsulación de invariantes de dominio en objetos de valor inmutables (ej. `Email` VO en `domain/entities/vo/email.vo.ts`), los cuales autocontienen sus propias reglas de validación y formateo.

### 8. Static Factory Method Pattern
* Las entidades de dominio (`User.create()`, `DoctorProfile.create()`, `Specialty.create()`) utilizan métodos de fábrica estáticos encargados de aplicar identificadores únicos (UUIDs), marcas de tiempo predeterminadas y transformaciones automáticas (ej. `Specialty.slugify` con normalización de caracteres diacríticos/acentos).

### 9. Data Mapper Pattern (Domain ↔ Persistence)
* Conversión bidireccional limpia entre modelos relacionales de Prisma y Agregados del Dominio a través de mappers dedicados (`UserMapper`, `DoctorProfileMapper`, `SpecialtyMapper`), exponiendo métodos estáticos `toDomain()`, `toCreateInput()` y `toUpdateInput()`.

### 10. Unit of Work & Transaction Pattern
* Abstracción mediante `UnitOfWorkInterface` (`PrismaUnitOfWork`) que envuelve operaciones atómicas multirepositorio en bloques `prisma.$transaction(...)` para garantizar consistencia ACID en mutaciones críticas.

### 11. Distributed Locking Pattern (Redis Lock Facade)
* Uso de `DISTRIBUTED_LOCK_SERVICE_INTERFACE` (`RedisLockModule`) para garantizar idempotencia y evitar race conditions en operaciones concurrentes distribuidas mediante operaciones atómicas `SET key id EX ttl NX` y scripts de liberación Lua.

### 12. Test Factory Pattern (Service-Aware Test Fixtures)
* Abstracción centralizada en `TestFactories` (`UserFactoryBuilder`, `DoctorProfileFactoryBuilder`, `SpecialtyFactoryBuilder`) que inyecta repositorios del contenedor de NestJS para la creación fluida y type-safe de datos de prueba en suites E2E (`TestFactories.user()`, `TestFactories.doctorProfile()`, `TestFactories.specialty()`).

### 13. Role-Based Access Control (RBAC) & Guard Pattern
* Autenticación JWT global mediante `JwtAuthGuard` combinada con metadatos explícitos `@Public()` (para endpoints abiertos) y `@Roles(UserRole.ADMIN, UserRole.DOCTOR)` validados en `RolesGuard`.

### 14. Rate Limiting / Throttling Pattern
* Protección global de la API frente a ataques de fuerza bruta mediante `CustomThrottlerGuard` y `ThrottlerModule`, permitiendo la superación controlada de límites en entornos de integración vía cabecera `x-force-throttler`.

### 15. Global Exception Filter & Response Serialization Pattern
* Intercepción centralizada de excepciones mediante `AllExceptionsFilter` para transformar errores no capturados en respuestas JSON HTTP estandarizadas.
* Formateo unificado del contrato de respuestas API mediante `TransformInterceptor` (`{ data: ..., meta: ... }`).

### 16. Fail-Fast Connection Pool Pattern (Prisma + PostgreSQL)
* Configuración de la capa de persistencia con el adaptador nativo `PrismaPg` y límites de timeout estrictos (`connectionTimeoutMillis: 5000`), evitando el agotamiento de memoria en Node.js ante saturaciones de carga.

---

## 🧪 Pruebas y Cobertura (E2E & Unit Tests)

El proyecto cuenta con una suite completa de pruebas E2E aisladas que ejecutan escenarios Gherkin reales contra la base de datos de test (`.env.test`) y Redis:

```bash
docker exec md_nestjs npm run test:e2e
```

**Módulos probados:**
* `specialties-test.e2e-spec.ts`: CRUD de Especialidades, permisos `@Roles(UserRole.ADMIN)` y verificación de caché en Redis + invalidaciones.
* `doctors-test.e2e-spec.ts`: Creación de Perfil Médico (`DOCTOR`), unicidad de licencia, búsqueda paginada y verificación administrativa por `ADMIN`.
* `authentication-test.e2e-spec.ts`, `auth-mfa-test.e2e-spec.ts`, `registration-test.e2e-spec.ts`, `password-reset-test.e2e-spec.ts`.
