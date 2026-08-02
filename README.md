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

## ⚡ Patrones de Arquitectura e Infraestructura Aplicados

### 1. Hexagonal + CQRS (Clean Architecture)
Cada módulo del backend desacopla estrictamente sus capas:
* **Dominio**: Agregados (`DoctorProfile`, `Specialty`, `User`) con reglas invariantes, métodos estáticos de creación y sin dependencias de I/O ni frameworks.
* **Aplicación**: Comandos (`CreateDoctorProfileCommand`, `CreateSpecialtyCommand`) y Consultas (`GetDoctorsQuery`) gestionadas de forma explícita mediante `@nestjs/cqrs`. Validaciones paralelizadas con `Promise.all`.
* **Infraestructura**: Adaptadores de persistencia con Prisma (`PrismaDoctorProfileRepository`, `PrismaSpecialtyRepository`) y convertidores bidireccionales (`DoctorProfileMapper`, `SpecialtyMapper`).

### 2. Patrón Decorador de Caché en Redis (`[BE-DOC-02]`)
Para evitar contaminar los adaptadores de base de datos con lógica de almacenamiento en caché:
* **`SpecialtyQueryServicePort`**: Define las operaciones de consulta.
* **`CachedSpecialtyQueryService`**: Decorador que intercepta la lectura de especialidades activas (`specialties:active`), consulta la memoria en Redis (TTL 60s) y ejecuta la invalidación automática en los handlers de mutación (`POST`, `PATCH`, `DELETE`).

### 3. Separación CQRS con Query Services (`[BE-DOC-01]`)
* Las consultas de lectura paginadas (`GET /doctors`) utilizan un **Query Service** dedicado (`DoctorQueryServicePort` / `PrismaDoctorQueryService`), optimizado para paginación (`perPage`) y proyecciones sin la sobrecarga de cargar agregados completos de escritura.

### 4. Pool de Conexiones Fail-Fast (Prisma + PostgreSQL)
* **Fail Fast**: El timeout de espera de conexión está limitado a 5 segundos (`connectionTimeoutMillis: 5000`), evitando colapsar la RAM de Node.js por acumulación de peticiones pendientes ("efecto bola de nieve").
* **Rendimiento**: Uso del adaptador nativo `PrismaPg` que evita penalizaciones por arranques en frío.

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
