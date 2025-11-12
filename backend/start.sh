#!/bin/sh

# Script de inicio para Facturando Zen Backend
echo "🚀 Iniciando Facturando Zen Backend..."

# Instalar dependencias si es necesario
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependencias..."
    npm install --production
fi

# Iniciar aplicación
echo "▶️ Iniciando aplicación..."
exec npm start
