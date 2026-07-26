#!/bin/bash
set -Eeuo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd -P)"

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log_info() {
    printf "%b[INFO]%b %s\n" "$BLUE" "$NC" "$*"
}

log_success() {
    printf "%b[SUCCESS]%b %s\n" "$GREEN" "$NC" "$*"
}

log_warning() {
    printf "%b[WARNING]%b %s\n" "$YELLOW" "$NC" "$*"
}

log_error() {
    printf "%b[ERROR]%b %s\n" "$RED" "$NC" "$*" >&2
}

trap 'log_error "Error en línea $LINENO"' ERR

ENV_FILE="$SCRIPT_DIR/.env"

if [[ ! -f "$ENV_FILE" ]]; then
    log_error "El archivo .env no existe en $ENV_FILE"
    exit 1
fi

ENV_LINE=$(grep -E "^ENVIRONMENT=" -- "$ENV_FILE" || true)

if [[ -z "$ENV_LINE" ]]; then
    log_error "No se pudo encontrar la variable ENVIRONMENT en el archivo .env"
    exit 1
fi

ENV_VALUE="${ENV_LINE#*=}"
ENV_VALUE=$(printf "%s" "$ENV_VALUE" | tr -d '[:space:]' | tr -d '"' | tr -d "'")
ENV_VALUE=$(printf "%s" "$ENV_VALUE" | tr '[:upper:]' '[:lower:]')

log_info "Entorno detectado: ${ENV_VALUE}"

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
        log_error "Valor de ENVIRONMENT no válido: '${ENV_VALUE}'"
        log_error "Valores válidos: dev, development, prod, production"
        exit 1
        ;;
esac

COMPOSE_FILE="$SCRIPT_DIR/$COMPOSE_FILE"

if [[ ! -f "$COMPOSE_FILE" ]]; then
    log_error "El archivo ${COMPOSE_FILE} no existe"
    exit 1
fi

log_success "Usando archivo: ${COMPOSE_FILE}"

log_info "Construyendo e iniciando contenedores..."

docker compose -f "$COMPOSE_FILE" up --build -d || {
    log_error "Hubo un error al iniciar los contenedores"
    exit 1
}

log_success "Contenedores iniciados correctamente"
printf "\n"
log_info "Para ver los logs en tiempo real, ejecuta:"
printf "  docker compose -f %s logs -f\n" "$COMPOSE_FILE"
printf "\n"
log_info "Para detener los contenedores, ejecuta:"
printf "  %s/stop.sh\n" "$SCRIPT_DIR"
