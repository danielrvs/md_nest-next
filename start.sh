#!/bin/bash

# Script para iniciar docker-compose según el entorno definido en .env mostrando mensajes informativos

# Colores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Función para mostrar mensajes
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Verificar que existe el archivo .env
if [ ! -f ".env" ]; then
    log_error "El archivo .env no existe en el directorio actual"
    exit 1
fi

# Leer la variable ENVIROMENT del archivo .env
ENV_VALUE=$(grep -E "^ENVIROMENT=" .env | cut -d '=' -f2 | tr -d '[:space:]' | tr -d '"' | tr -d "'")

# Verificar que se pudo leer la variable
if [ -z "$ENV_VALUE" ]; then
    log_error "No se pudo encontrar la variable ENVIROMENT en el archivo .env"
    exit 1
fi

# Convertir a minúsculas
ENV_VALUE=$(echo "$ENV_VALUE" | tr '[:upper:]' '[:lower:]')

log_info "Entorno detectado: ${ENV_VALUE}"

# Determinar qué docker-compose usar
case "$ENV_VALUE" in
    dev|development)
        COMPOSE_FILE="infrastructure/docker-compose.dev.yml"
        log_info "Iniciando entorno de DESARROLLO..."
        ;;
    prod|production)
        COMPOSE_FILE="infrastructure/docker-compose.prod.yml"
        log_info "Iniciando entorno de PRODUCCIÓN..."
        ;;
    *)
        log_error "Valor de ENVIROMENT no válido: '${ENV_VALUE}'"
        log_error "Valores válidos: dev, development, prod, production"
        exit 1
        ;;
esac

# Verificar que existe el archivo docker-compose
if [ ! -f "$COMPOSE_FILE" ]; then
    log_error "El archivo ${COMPOSE_FILE} no existe"
    exit 1
fi

log_success "Usando archivo: ${COMPOSE_FILE}"

# Ejecutar docker-compose
log_info "Construyendo e iniciando contenedores..."

docker-compose -f "$COMPOSE_FILE" up --build -d

if [ $? -eq 0 ]; then
    log_success "Contenedores iniciados correctamente"
    echo ""
    log_info "Para ver los logs en tiempo real, ejecuta:"
    echo "  docker-compose -f $COMPOSE_FILE logs -f"
    echo ""
    log_info "Para detener los contenedores, ejecuta:"
    echo "  ./stop.sh"
else
    log_error "Hubo un error al iniciar los contenedores"
    exit 1
fi
