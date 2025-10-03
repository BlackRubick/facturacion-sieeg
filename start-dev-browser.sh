#!/bin/bash

# Script para iniciar Chrome con CORS deshabilitado para desarrollo
# Solo para testing - NO usar en producción

echo "🌐 Iniciando Chrome con CORS deshabilitado para desarrollo..."
echo "⚠️  ADVERTENCIA: Solo para desarrollo local"

# Crear directorio temporal para datos de Chrome
CHROME_DATA_DIR="/tmp/chrome-dev-$(date +%s)"
mkdir -p "$CHROME_DATA_DIR"

# Intentar diferentes comandos de Chrome según el sistema
if command -v google-chrome &> /dev/null; then
    google-chrome --user-data-dir="$CHROME_DATA_DIR" --disable-web-security --disable-features=VizDisplayCompositor --allow-running-insecure-content --disable-blink-features=AutomationControlled http://localhost:3000
elif command -v chromium &> /dev/null; then
    chromium --user-data-dir="$CHROME_DATA_DIR" --disable-web-security --disable-features=VizDisplayCompositor --allow-running-insecure-content --disable-blink-features=AutomationControlled http://localhost:3000
elif command -v chromium-browser &> /dev/null; then
    chromium-browser --user-data-dir="$CHROME_DATA_DIR" --disable-web-security --disable-features=VizDisplayCompositor --allow-running-insecure-content --disable-blink-features=AutomationControlled http://localhost:3000
else
    echo "❌ No se encontró Chrome/Chromium instalado"
    echo "📋 Instala Chrome o Chromium, o abre manualmente el navegador con:"
    echo "   --disable-web-security --allow-running-insecure-content"
    echo "🔗 URL: http://localhost:3000"
fi

# Limpiar al salir
trap "rm -rf $CHROME_DATA_DIR" EXIT
