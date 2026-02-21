#!/bin/bash
# ============================================================
# deploy-to-android.sh
# Builda o widget air-control e copia para os assets do Android
# ============================================================
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
DIST_DIR="$SCRIPT_DIR/dist"
ANDROID_RAW="$SCRIPT_DIR/../../app/src/main/res/raw"
OUTPUT_FILE="$ANDROID_RAW/app.html"

echo ""
echo "🚀 Deploy do widget air-control para o Android"
echo "================================================"

# 1. Limpar dist anterior
echo ""
echo "🧹 Limpando build anterior..."
rm -rf "$DIST_DIR"

# 2. Build night mode (usado no cluster do carro)
echo ""
echo "📦 Buildando widget (night mode)..."
cd "$SCRIPT_DIR"
npx parcel build app-night.html --dist-dir dist --public-url ./

# 3. Inline CSS/JS no HTML
echo ""
echo "🔗 Inlining CSS e JS no HTML..."
node inline.js

# 4. Copiar para assets do Android
echo ""
echo "📲 Copiando para Android resources..."
mkdir -p "$ANDROID_RAW"
cp "$DIST_DIR/app-night.html" "$OUTPUT_FILE"

# 5. Mostrar resultado
FILE_SIZE=$(du -h "$OUTPUT_FILE" | cut -f1)
echo ""
echo "================================================"
echo "✅ Deploy concluído!"
echo "   📄 Arquivo: app/src/main/res/raw/app.html"
echo "   📏 Tamanho: $FILE_SIZE"
echo ""
echo "⚠️  Agora recompile o APK no Android Studio!"
echo "================================================"
echo ""
