#!/bin/bash

# Script para ejecutar el servidor en producción en AWS

echo "🚀 Iniciando servidor de producción..."

# Verificar que tengamos permisos para puerto 80
if [ "$EUID" -ne 0 ]; then
  echo "❌ Se requieren permisos de root para usar puerto 80"
  echo "📝 Ejecuta: sudo ./start-production.sh"
  exit 1
fi

# Verificar que el directorio dist existe
if [ ! -d "dist" ]; then
  echo "❌ No se encuentra el directorio dist"
  echo "📝 Ejecuta primero: npm run build"
  exit 1
fi

# Verificar que el archivo .env existe
if [ ! -f ".env" ]; then
  echo "❌ No se encuentra el archivo .env"
  exit 1
fi

echo "✅ Verificaciones pasadas"
echo "🌐 Iniciando servidor en puerto 80..."
echo "📁 Sirviendo desde directorio dist"
echo "🔗 Configurado para: $(grep FACTURA_API_ENV .env)"

# Ejecutar el servidor
node server-proxy.js
