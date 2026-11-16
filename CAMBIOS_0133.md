# CAMBIOS 0133 · ajustes de móvil (configurador y productos)

Rama `encargo/0133-web-ajustes-movil`, sobre 0a8f5a7. Sin despliegue ni merge.

## Ancho ≤ 600 px
- Lista de equipos (paso 4): la referencia va encima de la descripción (línea pequeña y apagada); la descripción ocupa todo el ancho y la cantidad queda a la derecha.
- Descripción de partida plegada: botón «Ver descripción de partida» (`aria-expanded`, `aria-controls`) que la despliega y cambia a «Ocultar…». El Excel no cambia: lleva siempre la descripción completa.

## Todos los anchos (solo altura mínima)
- Selector Básico/Estándar/Premium del paso 4, enlace «Cambiar datos» (área de toque, mismo aspecto) y botones de filtro de productos.html: mínimo 44 px de alto.

## Escritorio
Igual, salvo la altura de esos controles. El botón de plegado está oculto y la descripción siempre abierta.

## Código
- `js/configurador.js`: solo el pintado de la lista (nueva función pura `zonaHtml`, exportada para la prueba) y el clic del botón. Reglas, cifras, Excel y lead intactos.
- `css/configurador.css`, `productos.html` (solo CSS de la barra de filtros).
- `js/tests/0133.test.cjs`: Excel idéntico byte a byte al de 0a8f5a7 (BTS estándar 40 viviendas y hotel desatendido), HTML con el botón aria-expanded, reglas CSS.

## No comprobado
Sin Chromium/Playwright accesible en esta carpeta: no se ha medido scrollWidth a 360 px ni las alturas reales, ni hay capturas. Pendiente de la comprobación de la Dirección.
