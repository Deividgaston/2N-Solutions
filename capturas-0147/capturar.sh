#!/usr/bin/env bash
# Capturas del encargo 0147 con Chromium headless (sin Playwright), a 360 y 1280 px.
# Uso, desde la raíz del repositorio:  bash capturas-0147/capturar.sh
# Genera una página temporal _cap0147.html (copia de configurador.html con un guion que hace los clics),
# la fotografía en tres escenas y la borra. CHROME=<ruta> para usar otro Chromium.
set -euo pipefail
RAIZ="$(cd "$(dirname "$0")/.." && pwd)"
SALIDA="$RAIZ/capturas-0147"
CHROME="${CHROME:-$(ls -d "$HOME"/.cache/ms-playwright/chromium-*/chrome-linux64/chrome | tail -1)}"
PAG="$RAIZ/_cap0147.html"
trap 'rm -f "$PAG"' EXIT

GUION='<script>window.addEventListener("load",function(){
  var q=function(s){return document.querySelector(s)},esc=new URLSearchParams(location.search).get("escena");
  q(".cz-type[data-t=btr]").click(); q("[data-cz=\"3\"]").click(); q("[data-cz=\"4\"]").click();
  if(esc==="quitado"){q("[data-rm=\"c|Gestión\"]").click();}
  if(esc==="vacio"){var b;while((b=document.querySelector(".cz-caph .cz-rm")))b.click();}
  window.scrollTo(0,0);
});</script>'
sed "s#</body>#${GUION//&/\\&}</body>#" "$RAIZ/configurador.html" > "$PAG"

for ancho in 360 1280; do
  for escena in resultado quitado vacio; do
    "$CHROME" --headless=new --no-sandbox --disable-gpu --hide-scrollbars \
      --window-size="$ancho,2600" --virtual-time-budget=8000 \
      --screenshot="$SALIDA/${escena}-${ancho}.png" "file://$PAG?escena=$escena"
  done
done
echo "Capturas en $SALIDA"
