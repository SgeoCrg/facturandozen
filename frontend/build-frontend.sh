#!/bin/bash

# Script para construir el frontend de Facturando Zen
# Optimizado para despliegue rápido

set -e

echo "🏗️ CONSTRUYENDO FRONTEND FACTURANDO ZEN"
echo "======================================"

# Colores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${BLUE}[$(date +'%H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}[✓]${NC} $1"
}

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    echo "Error: No se encuentra package.json. Ejecutar desde directorio frontend."
    exit 1
fi

# Instalar dependencias
log "Instalando dependencias..."
npm ci --only=production

# Construir aplicación
log "Construyendo aplicación React..."
npm run build

# Verificar que el build se creó
if [ -d "build" ]; then
    success "Frontend construido correctamente"
    log "Archivos generados:"
    ls -la build/
else
    echo "Error: No se generó el directorio build"
    exit 1
fi

success "¡Frontend listo para despliegue!"
