# Directorio Médico Enterprise (MD Nest-Next)

Este repositorio contiene una plataforma moderna, desacoplada y de alto rendimiento para la gestión y búsqueda de un directorio médico, junto con un portal de noticias/blog especializado en salud. La arquitectura anterior basada en WordPress ha sido migrada a un stack moderno y desacoplado utilizando un backend en **NestJS** y un frontend en **Next.js**.

---

## 🚀 Arquitectura y Tecnologías

La infraestructura del proyecto está completamente dockerizada y estructurada bajo una arquitectura multinodo que incluye los siguientes servicios:

*   **Backend**: **NestJS 11** corriendo sobre **Node.js 24** (TypeScript), utilizando **Prisma ORM** para el acceso a datos.
*   **Frontend**: **Next.js 16** (React 19) estructurado bajo App Router y estilado con **Tailwind CSS v4**.
*   **Base de datos**: **PostgreSQL 18** (Alpine) administrado de forma segura y optimizada (Connection Pool fail-fast).
*   **Caché y Almacenamiento Key-Value**: **Redis 8.4** integrado mediante la API global de Cache de NestJS (`@nestjs/cache-manager` con adaptador `Keyv`).
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
| **Backend (NestJS)** | [http://localhost:3000](http://localhost:3000) | API REST y WebSocket. Documentación Swagger (si aplica). |
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
│   │   ├── modules/             # Módulos específicos del dominio (auth, doctors, etc.)
│   │   └── shared/              # Recursos compartidos e infraestructura (Prisma, Redis Cache)
│   └── test/                    # Tests de integración y E2E
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

## ⚡ Patrones de Infraestructura Aplicados

### Pool de Conexiones Fail-Fast (Prisma + PostgreSQL)
Para evitar cuellos de botella en picos de tráfico elevados, la inicialización del cliente de base de datos implementa un pool de conexiones optimizado mediante el adaptador nativo `pg`:
* **Fail Fast**: El timeout de espera de conexión está limitado a 5 segundos (`connectionTimeoutMillis: 5000`), evitando colapsar la RAM de Node.js por acumulación de peticiones pendientes ("efecto bola de nieve").
* **Rendimiento**: Sustitución del motor de conexión nativo de Rust por un pool de Node.js administrado que evita penalizaciones por arranques en frío.

### Caché Distribuida resiliente en Redis
El backend integra el módulo de caché implementando reintentos exponenciales amortiguados:
* Ante desconexiones o fallos en el nodo de Redis, la aplicación no cae, sino que aplica una estrategia de reconexión adaptativa (`reconnectStrategy`) garantizando tolerancia a fallos.

---

## 🔮 Roadmap y Próximos Pasos

1. **Procesamiento Asíncrono con RabbitMQ**: Implementar colas de mensajería para gestionar el flujo de notificaciones y confirmación de citas de manera asíncrona.
2. **Definición de Esquemas en Prisma**: Diseñar las tablas relacionales para especialistas, calendarios, citas y ausencias.
3. **Cobertura E2E en NestJS**: Ampliar los tests en `backend/test` para simular las llamadas API de reserva de citas y evaluar transacciones concurrentes.
