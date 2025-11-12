#!/bin/sh

# Script de inicio simple para Facturando Zen Backend
echo "🚀 Iniciando Facturando Zen Backend..."

# Esperar a que PostgreSQL esté listo
echo "⏳ Esperando PostgreSQL..."
sleep 10

# Instalar dependencias si es necesario
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependencias..."
    npm install --production
fi

# Iniciar aplicación
echo "▶️ Iniciando aplicación..."
exec node src/server.js
