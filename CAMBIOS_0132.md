# CAMBIOS 0132 · Mejoras del boceto W-03 sobre la web actual

Rama `encargo/0132-web-mejoras-boceto-w03`, creada desde `main` = `ff2c6fa`. Sin publicar: sin despliegue, sin escribir en Firestore ni en Storage.
Se conserva el diseño actual (variables y componentes de `css/theme.css`); del boceto solo se han portado las mejoras.

## Qué se ha cambiado, por página

| Página / fichero | Cambio |
|---|---|
| `configurador.html` (nuevo) | Configurador en 4 pasos (edificio, tamaño, nivel, lista) con el menú, el pie y el modal de contacto de la web. |
| `js/configurador.js` (nuevo) | Núcleo (reglas, mediciones, coste a PVP, xlsx, mensaje del lead; también se carga desde Node) e interfaz. |
| `css/configurador.css` (nuevo) | Estilos del configurador con las variables de la web (`--primary`, `--bg-card`, `--border`…). |
| `index.html` | Enlace «Configurador» en el menú y en el pie; banda «Tu edificio, con su lista de equipos» entre Soluciones y Por qué 2N. |
| `productos.html` + `js/productos-renderer.js` | Fotos normalizadas, fundido de Mobile Video, barra de filtros centrada, ficha técnica en castellano (tarjeta y detalle). |
| `solucion-*.html` (6) | Solo el enlace «Configurador» en menú y pie. |
| `css/theme.css` | Logo más grande; columnas laterales del menú de 320 a 260 px y separación de 2,5 a 2 rem para que quepan 6 entradas. Versión `theme.css?v=2.4` en las páginas del alcance. |
| `media/productos/` (nuevo) | 17 fotos `pn_*.jpg` copiadas de `docs/web-fotos-generadas/` (sin convertir ni recomprimir). |
| `fichas/` (nuevo) | 10 PDF de `docs/fichas-tecnicas-es/` (sin tocar). |
| `js/tests/0132.test.cjs` (nuevo) | 14 pruebas `node:test`. Se ejecutan con `node --test js/tests/0132.test.cjs`. |

### Configurador
- 6 verticales (BTS, BTR, oficinas, hoteles, retail, seguridad crítica), 4 pasos, 3 niveles, interruptores y reglas de `docs/W03_configurador_reglas_v10.md` con los cambios v11 a v20. Las reglas, referencias y textos están portados **sin cambios** del bloque del configurador de `docs/W03_boceto/tpl20.html`.
- Mediciones por secciones: desglose (referencia, descripción, cantidad) y «Ud. … marca 2N®. Suministro de conjunto compuesto por: … Características técnicas: … Función: …».
- Excel sin librerías (zip de XML sin compresión), con las hojas «Mediciones» y «Desglose por referencia», sin precios. Botón «Empezar de nuevo».
- Coste orientativo a PVP: equipos de la tarifa 2N (tabla `PR`), red estimada a 20 € por puerto PoE (estimación sin verificar, no es producto 2N) y, en residencial, columna «solo app» sin monitores con My2N 10 años (9137954, 225 € por vivienda). **Sin cableado ni mano de obra y sin 2 hilos** (decisión de David del 15/11). Redondeo a 10 €.
- Formulario antes de descargar (nombre, email, empresa). La descarga no depende del lead; si el lead falla se avisa en pantalla y se registra en consola.
- Lead: `POST` REST a `web_leads` con el mismo patrón y la misma clave pública que el formulario de la portada (`js/home.js`). Campos: `name`, `email`, `company` (solo si se rellena), `projectType`, `message`, `source = "configurador"` y `createdAt`; ninguno más.
  - `projectType` usa los códigos del select de la portada (`bts`, `btr`, `office`, `hotel`, `retail`, `security`), no el nombre largo, para que NEXO los trate igual que los de la portada.
  - `message`: «Configurador · vertical · nivel. Cantidades… Incluye… Total: N referencias, M unidades. Coste orientativo a PVP: …», recortado a 2000 caracteres. Límites de las reglas (`CRM-PREMIUM/firestore.rules`, `web_leads`): `name` ≤ 200, `email` ≤ 200, `company` ≤ 200, `projectType` ≤ 50, `source` ≤ 50, `message` ≤ 2000. No se tocan las reglas.

### Productos
- Foto por nombre de producto (tabla `MEDIA` de `js/productos-renderer.js`, equivale al mapa `PIMG` del boceto, por patrón de nombre para tolerar variantes como «IP Force» o «IP Force 2.0»). Sin coincidencia, sigue la `imageUrl` de Firestore sobre fondo oscuro. Contenedor cuadrado, `object-fit: contain`, 10 % de aire; IP Solo, 24 %.
- 2N® Mobile Video: alterna con fundido, 4 s cada una (ciclo CSS de 8 s), la foto del Apple Watch (`pn_my2n.jpg`) y su `imageUrl`. Con `prefers-reduced-motion` se queda en el reloj.
- Fichas técnicas en castellano (mapa `FICHA` del boceto): 10 locales en `fichas/` (IP Style, IP Verso 2.0, IP One, IP Solo, IP Force 2.0, IP Uni, Indoor View, Access Unit 2.0, Fortis Cylinder, Fortis Handle) y 5 que apuntan a 2n.com (IP Safety, Indoor Compact, Clip, Access Unit M, Access Commander Box 2.0). Indoor Talk y Access Unit QR no tienen ficha en castellano: no llevan enlace.

### Logo
El PNG (1020 × 825) lleva mucho margen transparente: el «2N» ocupa 659 × 311 px. Se escala el mismo fichero para que el «2N» mida 26 px de alto en escritorio (imagen a 69 px) y 22 px en móvil (imagen a 58 px), con márgenes negativos que devuelven a la barra su altura. No se ha cambiado el fichero del logo.

## De dónde sale cada cifra
- **PVP** (51 referencias): tarifa 2N que guarda nexo-v3 (`src/data/fixtures/tarifa2N.ts`, `tarifa/v1/productos` a 10/09/2026), tal como la recoge la tabla `PR` del boceto v20. No se ha vuelto a leer nexo-v3: es la tabla del boceto sin cambios. Los totales de la prueba (32.740 € con monitor y 20.180 € solo app para BTS de 40 viviendas) coinciden con los del boceto.
- **Red**: 20 € por puerto PoE, estimación sin verificar (`W03_configurador_reglas_v10.md`, v20). Cuentan como puerto placas, lectores, monitores, teléfonos y Access Commander Box; no cuentan módulos, marcos, cajas, licencias, tarjetas, relés ni Fortis.
- **My2N 10 años**: 225 € por vivienda (referencia 9137954).
- **Características técnicas de las partidas**: tabla `SPEC` del boceto (fichas oficiales; Access Unit QR, IP Safety y Access Commander Box 2.0 de las páginas de producto de 2n.com).
- **Fichas PDF**: `docs/fichas-tecnicas-es/` (10 ficheros) y los enlaces a 2n.com del mapa `FICHA` del boceto `2N-web-v20.html`.
- **Fotos**: `docs/web-fotos-generadas/pn_*.jpg` (17 ficheros). Los `p_*`, `f*`, `d*` y demás no se han usado: son de verticales (ver más abajo).

## Datos de producto escritos en el repo (punto 5 del encargo)
Buscado en `*.html`, `*.js`, `*.md` y `*.css` (sin `scratch/`, `scripts/` ni `js/services/`, que no se tocan): no hay en el repo ningún texto de «Clip 4″/4,3″», «Access Unit M IP54/IP55», «AC Box» ni «Indoor Touch 2.0». Esos datos solo existen en Firestore. En el configurador sí están corregidos (Clip 4,3″, Access Commander Box 2.0). Pendiente para Firestore, ver abajo.

## Queda para Firestore / NEXO (sin el sí de David no se carga)
1. **Datos de producto en `web_products`** (corregir desde NEXO):
   - «Clip»: pantalla de 4,3″ (la v9 la puso en 4″ por error).
   - «Access Unit M»: protección IP55.
   - «Access Commander Box»: sustituir por «2N® Access Commander Box 2.0» (1120120E).
   - «Indoor Touch 2.0»: descatalogado (retirarlo o marcarlo).
   - Nombres: la tabla `MEDIA` casa por patrón de nombre (`ip style`, `ip verso`, `ip one`, `ip solo`, `ip force`, `ip uni`, `ip safety`, `indoor view`, `indoor compact`, `indoor talk`, `clip`, `access unit qr`, `access unit m`, `access unit 2`, `commander box`, `fortis cylinder`, `fortis handle`, `mobile video`). Si se renombra algún producto, hay que mantenerlo reconocible.
2. **Textos ampliados de verticales** (`web_*`): `docs/W03_boceto/vextra.js` y `docs/W03_textos_verticales_v9_ampliacion.js` (y la base `W03_textos_verticales_v8.js`).
3. **Fotos de verticales**: las de `docs/web-fotos-generadas/` que no son `pn_*` (`f1_btr`…`f8_vms`, `d1_piscina`, `d2_ascensor`, `d3_indoor`, `d7a`, `hot_*`, `ofi_verso`, `garaje_*`, `acc_*`, `ac_dash`, `p_*`) y `docs/WEB_FOTOS_PENDIENTES_2026-11-14.md`.

## Pruebas
- `node --check` de `js/configurador.js`, `js/productos-renderer.js` y `js/tests/0132.test.cjs`.
- `node --test js/tests/0132.test.cjs`: 14 pruebas. BTS estándar de 40 viviendas (32.740 € con monitor, 20.180 € solo app, redondeo a 10 €), hotel desatendido (916201 + 91550947 en marco 9155012 y caja 9155015), Access Commander con 91379601, 9137424E y 11202601 en todas las combinaciones, redacción de partidas, precio y descripción de todas las referencias, XLSX como zip válido (CRC, directorio central, hojas, y `unzip -t`), lead solo con campos permitidos y dentro de sus límites, interfaz completa con un DOM de mentira (4 pasos, descarga, lead, error del lead, empezar de nuevo), ficheros de fotos y fichas existentes y ninguna ruta `assets/<subcarpeta>/` cambiada respecto a `ff2c6fa` (ni nada de lo prohibido).

## Lo que NO se ha podido comprobar
- **Visualmente en un navegador**: el host no tiene navegador y no se ha podido usar Playwright. El aspecto del configurador, las fotos cuadradas, el fundido de Mobile Video, la barra de filtros, el logo de 26/22 px y que el menú de 6 entradas quepa a 1280 px (ajuste de las columnas laterales en `theme.css`) están razonados desde el CSS, no vistos. Hay que abrirlas en local o en una vista previa antes de publicar.
- **El lead contra producción**: no se ha escrito en Firestore. Se ha comprobado que el cuerpo cumple las reglas de `web_leads` (campos y longitudes) leyendo `firestore.rules` de CRM-PREMIUM, no con una escritura real.
- **Nombres reales de productos en Firestore**: el host no tiene red; la tabla `MEDIA` se ha escrito contra los nombres del boceto y de `scratch/export-nsoluciones-2026-07-04.json`.
- `company.html` y `casos-exito.html` (fuera del alcance) no llevan el enlace «Configurador» en el menú ni el `theme.css?v=2.4`: cargarán el logo nuevo cuando caduque su caché. El menú de esas dos páginas tiene 5 entradas.
- `assets/web/hero-productos.webp` (usada por el hero de `configurador.html`, igual que `productos.html`) está en una carpeta ignorada por Git y no está en esta copia de trabajo.
