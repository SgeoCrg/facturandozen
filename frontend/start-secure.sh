#!/bin/bash

# Script de inicio seguro para desarrollo
echo "🚀 Iniciando Sistema de Facturación..."

# Verificar que el backend esté corriendo
if ! curl -s http://localhost:3001/health > /dev/null; then
    echo "❌ Backend no está corriendo en puerto 3001"
    echo "💡 Ejecuta: cd backend && npm start"
    exit 1
fi

# Configurar variables de entorno para desarrollo seguro
export HTTPS=true
export SSL_CRT_FILE=./localhost.crt
export SSL_KEY_FILE=./localhost.key

# Generar certificados SSL para desarrollo local
if [ ! -f "./localhost.crt" ] || [ ! -f "./localhost.key" ]; then
    echo "🔐 Generando certificados SSL para desarrollo..."
    openssl req -x509 -newkey rsa:4096 -keyout localhost.key -out localhost.crt -days 365 -nodes -subj "/C=ES/ST=Madrid/L=Madrid/O=Facturacion/CN=localhost"
fi

echo "✅ Iniciando frontend con HTTPS..."
npm start
