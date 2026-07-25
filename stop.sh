#!/bin/bash

# Script para detener docker-compose según el entorno definido en .env

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
        log_info "Deteniendo entorno de DESARROLLO..."
        ;;
    prod|production)
        COMPOSE_FILE="infrastructure/docker-compose.prod.yml"
        log_info "Deteniendo entorno de PRODUCCIÓN..."
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

# Mostrar opciones
echo ""
echo "¿Qué acción deseas realizar?"
echo "  1) Detener contenedores (mantener datos)"
echo "  2) Detener y eliminar contenedores (mantener datos)"
echo "  3) Detener, eliminar contenedores Y ELIMINAR VOLÚMENES (ADVERTENCIA: se perderán datos)"
echo "  4) Cancelar"
echo ""
read -p "Selecciona una opción [1-4]: " option

case "$option" in
    1)
        log_info "Deteniendo contenedores..."
        docker-compose -f "$COMPOSE_FILE" stop
        ;;
    2)
        log_info "Deteniendo y eliminando contenedores..."
        docker-compose -f "$COMPOSE_FILE" down
        ;;
    3)
        log_warning "¡ADVERTENCIA! Esto eliminará todos los datos de la base de datos"
        read -p "¿Estás seguro? (escribe 'SI' para confirmar): " confirm
        if [ "$confirm" = "SI" ]; then
            log_info "Deteniendo, eliminando contenedores y volúmenes..."
            docker-compose -f "$COMPOSE_FILE" down -v
            log_warning "Volúmenes eliminados. Todos los datos se han perdido."
        else
            log_info "Operación cancelada"
            exit 0
        fi
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

if [ $? -eq 0 ]; then
    log_success "Operación completada correctamente"
else
    log_error "Hubo un error durante la operación"
    exit 1
fi
