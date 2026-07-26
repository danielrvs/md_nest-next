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
        log_info "Entorno de DESARROLLO"
        ;;
    prod|production)
        COMPOSE_FILE="infrastructure/docker-compose.prod.yml"
        log_info "Entorno de PRODUCCIÓN"
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

printf "\n"
printf "¿Qué acción deseas realizar?\n"
printf "  1) Detener contenedores (mantener datos)\n"
printf "  2) Detener y eliminar contenedores (mantener datos)\n"
printf "  3) Detener, eliminar contenedores Y ELIMINAR VOLÚMENES (ADVERTENCIA: se perderán datos)\n"
printf "  4) Cancelar\n"
printf "\n"

read -r -p "Selecciona una opción [1-4]: " option

case "$option" in
    1)
        log_info "Deteniendo contenedores..."
        docker compose -f "$COMPOSE_FILE" stop || {
            log_error "Error al detener contenedores"
            exit 1
        }
        log_success "Contenedores detenidos correctamente"
        ;;
    2)
        log_info "Deteniendo y eliminando contenedores..."
        docker compose -f "$COMPOSE_FILE" down || {
            log_error "Error al detener y eliminar contenedores"
            exit 1
        }
        log_success "Contenedores detenidos y eliminados correctamente"
        ;;
    3)
        log_warning "¡ADVERTENCIA! Esto eliminará todos los datos de la base de datos"
        read -r -p "¿Estás seguro? (escribe 'SI' para confirmar): " confirm
        if [[ "$confirm" != "SI" ]]; then
            log_info "Operación cancelada"
            exit 0
        fi
        log_info "Deteniendo, eliminando contenedores y volúmenes..."
        docker compose -f "$COMPOSE_FILE" down -v || {
            log_error "Error al eliminar contenedores y volúmenes"
            exit 1
        }
        log_warning "Volúmenes eliminados. Todos los datos se han perdido."
        log_success "Contenedores y volúmenes eliminados correctamente"
        ;;
    4)
        log_info "Operación cancelada"
        exit 0
        ;;
    *)
        log_error "Opción no válida"
        exit 1
        ;;
esac
