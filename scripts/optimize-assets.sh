#!/bin/bash
# ============================================================
# 2N Assets Optimizer (Pre-Deploy Hook)
# Detects heavy images (>1MB) and compresses them automatically
# ============================================================

ASSETS_DIR="./assets"
MAX_WIDTH="1600"

echo "🔍 Buscando nuevas fotos pesadas en $ASSETS_DIR..."

# Find images larger than 1MB
FILES_TO_PROCESS=$(find "$ASSETS_DIR" -type f \( -name "*.jpg" -o -name "*.jpeg" -o -name "*.png" \) -size +1M)

if [ -z "$FILES_TO_PROCESS" ]; then
    echo "✅ Todas las fotos están optimizadas. Listo para subir."
    exit 0
fi

echo "⚠️ Se encontraron fotos grandes. Comprimiendo..."

# Ensure imagemagick is available
if ! command -v magick &> /dev/null; then
    echo "Instalando compresor (ImageMagick)..."
    brew install imagemagick > /dev/null 2>&1
fi

echo "$FILES_TO_PROCESS" | while read -r file; do
    echo "  🔧 Optimizando: $(basename "$file")"
    
    if [[ "$file" == *.png ]]; then
        # PNG: Resize and strip metadata (keeps transparency)
        magick "$file" -resize "${MAX_WIDTH}x${MAX_WIDTH}>" -strip "$file" 2>/dev/null
    else
        # JPG: Resize, compress to 82% quality, and strip metadata
        magick "$file" -resize "${MAX_WIDTH}x${MAX_WIDTH}>" -quality 82 -strip "$file" 2>/dev/null
    fi
done

echo "✅ Compresión terminada. Continuamos con la subida..."
exit 0
