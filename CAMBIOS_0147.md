# CAMBIOS 0147 · quitar y recuperar capítulos o partidas en el resultado del configurador

Rama `encargo/0147-web-quitar-secciones`, sobre 7919ab4 (0132 + 0133). Sin despliegue ni merge.

## Qué hace el visitante
- En el resultado (paso 4), cada cabecera de capítulo y cada partida llevan un botón con un icono discreto (×), de 44 × 44 px, con texto accesible («Quitar capítulo Gestión», «Quitar partida Servidor de gestión de accesos»).
- Lo quitado desaparece de la lista, del coste, del Excel y del lead. La numeración (01, 01.01…) se rehace sin huecos.
- Bajo la lista sale «Has quitado: …» con un botón «Recuperar» por elemento («Recuperar capítulo Gestión») y «Recuperar todo» (solo si hay más de uno). Recuperar deja el resultado exactamente como estaba.
- Si se quita todo: aviso «Has quitado todas las partidas», sin bloque de coste, y el botón del Excel/envío queda desactivado con el motivo debajo («no hay nada que descargar ni enviar»).
- El lead que recibe David termina con «Quitado por el cliente: capítulo Gestión; partida Relé de seguridad (Seguridad).» (en el orden del resultado). Sin quitar nada, el texto es el de siempre. El Excel no lleva lo quitado y no añade ninguna línea.

## Cómo está hecho
- `js/configurador.js`: `build()` y sus reglas no se tocan. Un filtro (`filtrar`) se aplica a lo que devuelve `build()` dentro de `compute()`, antes de `coste`, `xlsxBytes` y `resumenLead`, que reciben ya lo filtrado. Estado de lo quitado: claves `c|capítulo` y `p|capítulo|partida` (únicas en todos los verticales, niveles e interruptores: lo comprueba una prueba). El HTML de la lista (`listaHtml`) y de «Has quitado» (`quitadosHtml`) son funciones puras exportadas para poder probarlas.
- `css/configurador.css`: botones, línea «Has quitado», aviso y estado vacío, con las variables del tema.
- `configurador.html` no cambia (los contenedores salen dentro de `#czzones`).
- `js/tests/0147.test.cjs` y `capturas-0147/capturar.sh`.

## Decisiones
1. **Quitar un capítulo no borra las partidas sueltas ya quitadas dentro de él**: al recuperar el capítulo siguen quitadas (como las dejó el visitante). En «Has quitado» se ve solo el capítulo mientras esté quitado.
2. **Cambiar la configuración**: cualquier cambio de tipo, nivel (también con el selector del paso 4), cifra o interruptor descarta lo quitado y lo avisa en una línea («Has cambiado la configuración, así que lo que habías quitado vuelve a estar incluido»). Si el visitante vuelve a «Cambiar datos» y no cambia nada, lo quitado se conserva (se compara una firma de tipo + cifras + nivel). Elegir un tipo en el paso 1 y «Empezar de nuevo» también lo descartan.
3. **Licencia de Access Commander**: NO se recalcula al quitar partidas. Se dimensiona en `build()` según el número de dispositivos de la configuración, y recalcularla exigiría tocar las reglas de build (fuera del permiso). Efecto: si el visitante quita zonas con dispositivos, la licencia que queda es la de la configuración completa (puede ser algo mayor de lo necesario). Si quita el capítulo Gestión, desaparece entera con la caja y las tarjetas. Anotado como pendiente para la Dirección.
4. **Avisos «A tener en cuenta»**: el del cilindro Fortis y el de las manillas Fortis Handle solo salen mientras quede alguna referencia FORTIS-CIL / FORTIS-HAN; el del PoE, mientras quede algún equipo con puerto; en BTS, la nota de gestión My2N pierde la frase «con monitor en la vivienda, la llamada a la app va incluida» si se quita la partida de monitores (queda «La gestión va con My2N, la plataforma en la nube de 2N.»). El aviso «El cilindro Fortis se calcula con perfil europeo 30/30» del bloque de coste ya dependía de lo que queda. Sin quitar nada, ninguna nota cambia.
5. **Residencial sin monitores**: la columna «Solo app» del coste y la suscripción My2N por vivienda dependen de la partida de monitores. Si se quita (capítulo Viviendas o esa partida), se muestra una sola columna (cambio de una línea en `coste()`: `B` solo si `A.viv > 0`; sin quitar nada, `A.viv` es siempre ≥ 1, comprobado por la prueba de identidad con 7919ab4).
6. **Envío en curso**: mientras se envía el lead, quitar y recuperar no hacen nada, para que el Excel y el lead enviados sean los que se ven (hallazgo de la revisión de Codex, corregido con prueba).
7. Foco: tras quitar o recuperar, el foco pasa a la línea «Has quitado» (o a la lista si ya no hay nada quitado), sin desplazar la página, para no perderlo cuando desaparece el botón pulsado.

## Pruebas
`node --test js/tests/0132.test.cjs js/tests/0133.test.cjs js/tests/0147.test.cjs` → 33 de 33 (19 anteriores sin tocar + 14 nuevas), 0 omitidas.
- Sin quitar nada: partidas, notas, coste, Excel (byte a byte) y lead idénticos a 7919ab4 en los 6 verticales × 3 niveles × 3 variantes de interruptores.
- Quitar un capítulo y una partida: el coste baja exactamente lo que cuesta lo quitado; el Excel y el lead cambian.
- Recuperar (uno a uno y «Recuperar todo»): mismo coste, mismas filas del Excel, mismo lead, en los 6 verticales.
- Numeración sin huecos en pantalla y en el Excel.
- Quitar todo: estado vacío, sin Excel ni envío (también con clics en un DOM de mentira, sin descarga ni petición).
- Cambiar tipo, nivel, cifra o interruptor descarta; sin cambios se conserva; el aviso sale una vez.
- El lead cabe en 2000 caracteres en el peor caso.

## No comprobado
- Capturas (`capturas-0147/`, 360 y 1280 px): este host no deja ejecutar Chromium al agente (pide aprobación) y no hay Playwright en la carpeta. `capturas-0147/capturar.sh` está escrito pero sin ejecutar ni probar. Tampoco se ha medido el aspecto real (alturas de 44 px, desbordes a 360 px).
