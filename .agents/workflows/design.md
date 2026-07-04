---
description: 
---

# SKILL: Diseño web B2B — Arquitectos, Ingenieros y Promotores Inmobiliarios

**Proyecto:** 2N Prescripción España  
**Versión:** 1.0  
**Aplicar en:** Cualquier página web, componente o interfaz del proyecto 2N-Projects

---

## IDENTIDAD DEL USUARIO FINAL

Antes de generar cualquier diseño, interioriza que el visitante de esta web es un **profesional técnico exigente**:

- **Arquitecto** → valora la estética, el detalle constructivo, los acabados. Compra con los ojos primero.
- **Ingeniero** → valora la precisión técnica, la documentación, los datos medibles, la integración.
- **Promotor inmobiliario** → valora el ROI, la diferenciación del producto, la reducción de riesgo.

**Nunca diseñes para el consumidor final. Siempre para el decisor técnico.**

---

## REGLAS DE DISEÑO VISUAL

### 1. Paleta cromática — No negociable

```
--color-primary:     #2563EB   /* Azul principal — acción, CTA, acento */
--color-primary-light: #3B82F6  /* Hover, iconos, links */
--color-bg-deep:     #0A0A0F   /* Fondo base — oscuro premium */
--color-bg-card:     #111827   /* Cards y superficies */
--color-bg-section:  #0D1117   /* Alternancia de secciones */
--color-border:      #1a2035   /* Bordes sutiles */
--color-text-primary: #FFFFFF  /* Texto principal */
--color-text-muted:  #9CA3AF  /* Texto secundario */
--color-text-hint:   #6B7280  /* Descripciones, meta */
```

**Regla de color:** Máximo 2 colores con intención. El azul es el único acento. Todo lo demás es escala de grises oscuros. Si quieres énfasis adicional: usa opacidad del azul (`#2563EB30`), nunca otro color.

---

### 2. Tipografía — Jerarquía estricta

```
Font: Inter o Plus Jakarta Sans
H1:   48–56px · weight 500 · line-height 1.1
H2:   32–38px · weight 500 · line-height 1.2
H3:   18–22px · weight 500
Body: 15–16px · weight 400 · line-height 1.7
Meta: 11–12px · weight 400 · color: muted
Label: 10–11px · weight 500 · letter-spacing: 2px · UPPERCASE · color: primary
```

**Regla tipográfica:** Los `section-label` (etiquetas de sección en mayúsculas) son obligatorios antes de cada H2. Dan estructura profesional. Ejemplo: "POR QUÉ 2N" encima de "La diferencia que eleva tu proyecto".

---

### 3. Espaciado — Respira como un proyecto premium

```
Sección padding:   48px–64px vertical · 32px–48px horizontal
Card padding:      16px–20px
Gap entre cards:   10px–12px
Gap entre secciones: nunca menos de 48px
```

**Regla de aire:** Si una sección parece apretada, añade espacio. Los arquitectos valoran el silencio visual tanto como el contenido.

---

### 4. Cards — Estructura uniforme

Toda card debe tener:

1. **Acento superior** — línea de 2px en `--color-primary` en el borde superior
2. **Icono SVG** — nunca emoji, nunca imagen rasterizada para iconos de UI. SVG minimalista en azul.
3. **Título** — 12–14px, weight 500, blanco
4. **Descripción** — 10–12px, color muted, 1-2 líneas máximo
5. **CTA link** — "Ver solución →" en azul, 10px

```css
card {
  background: #111827;
  border: 0.5px solid #1a2035;
  border-radius: 10px;
  border-top: 2px solid #2563EB;  /* acento obligatorio */
  padding: 16px;
}
```

---

### 5. Iconografía — Solo SVG técnico

**Prohibido:** emojis, FontAwesome genérico, iconos decorativos.  
**Obligatorio:** SVG paths geométricos, trazos finos (stroke-width: 1), estilo blueprint/técnico.

Los iconos deben evocar **planos de arquitectura**, no apps de consumo. Líneas limpias, sin rellenos sólidos excepto para acento puntual.

---

### 6. Jerarquía de conversión — Obligatoria en cada página

Toda página debe seguir esta estructura en este orden:

```
1. HERO          — Impacto + propuesta de valor + 2 CTAs
2. TRUST BAR     — Cifras o logos de credibilidad
3. CONTENIDO     — Verticals / Argumentos / Features
4. PRUEBA SOCIAL — Casos de uso reales o proyectos referencia
5. CTA FINAL     — Formulario de contacto/prescripción visible
6. FOOTER        — Mínimo, limpio
```

**Nunca saltarse ningún paso.** El promotor necesita ver cifras antes de leer argumentos. El arquitecto necesita ver casos reales antes de contactar.

---

### 7. Hero — Reglas específicas

El hero es el 80% de la conversión. Debe cumplir:

- [ ] Fondo oscuro con imagen arquitectónica o dispositivo 2N de alta calidad
- [ ] Badge con credencial inmediata (Red Dot Award / Axis Communications / años de experiencia)
- [ ] H1 máximo 6 palabras con alto impacto
- [ ] Subheadline que mencione explícitamente el público: "para arquitectos", "para proyectos residenciales"
- [ ] **Dos CTAs siempre:** primario (acción directa) + secundario (explorar)
- [ ] Sin scroll necesario para ver los CTAs en desktop

---

### 8. Secciones — Alternancia obligatoria

```
Hero          → bg: #0A0A0F
Trust bar     → bg: #0A0A0F
Verticals     → bg: #0D1117   (más claro)
Por qué 2N    → bg: #0A0A0F   (vuelve al base)
Casos de uso  → bg: #0D1117
CTA final     → bg: #0D1117
Footer        → bg: #060608   (más oscuro que todo)
```

La alternancia crea ritmo visual sin necesidad de color. No usar fondos blancos o claros — rompen el carácter premium.

---

### 9. Navegación — Estándar fijo

```html
[Logo 2N] ←————————————————————→ [Soluciones] [Sobre 2N] [2N.com] [Área Prescriptores CTA]
```

- Sticky con `backdrop-filter: blur(20px)` al hacer scroll
- CTA de nav siempre en azul sólido, nunca outline
- Selector de idioma discreto (ES/EN/PT/FR/IT)

---

### 10. Trust Bar — Formato estándar

Siempre 4–5 métricas en barra horizontal, separadas por líneas verticales:

```
[Número grande en azul]   [Número]   [Número]   [Número]   [Número]
[Label 10px muted]        [Label]    [Label]    [Label]    [Label]
```

Métricas fijas: 30+ años · 100+ países · 5M+ usuarios · 500K+ dispositivos · 5 años garantía

---

## REGLAS DE CONTENIDO Y COPY

### Tono — Siempre técnico-premium

- **Nunca:** "solución innovadora", "líder del mercado", "intuitivo y fácil"
- **Siempre:** datos concretos, normativa específica, nombres de producto reales (IP Verso, Access Commander, WaveKey)
- **Verbos:** especificar, integrar, prescribir, certificar, implementar — no "mejorar", "optimizar", "gestionar"

### Argumentos — Jerarquía por público

```
Para arquitectos:  Diseño (Red Dot) → Integración BIM → Normativa (CTE, EAA)
Para ingenieros:   APIs → Protocolos (SIP, ONVIF) → ISO 27001 → Documentación técnica
Para promotores:   ROI → Diferenciación → My2N gestión remota → Garantía 5 años
```

### CTAs — Vocabulario técnico

- Primario: "Solicitar especificación técnica" / "Descargar ficha técnica" / "Consultar prescripción"
- Secundario: "Ver soluciones por sector" / "Explorar productos" / "Acceder al área técnica"
- **Nunca:** "Saber más", "Click aquí", "Ver más"

---

## REGLAS TÉCNICAS

### Responsividad

```
Desktop (>1200px): grids de 3 columnas, hero con elemento visual a la derecha
Tablet (768-1200px): grids de 2 columnas
Mobile (<768px): 1 columna, CTAs a pantalla completa, hero simplificado
```

### Rendimiento

- Imágenes: WebP, lazy loading, máximo 200KB por imagen
- Fuentes: preload de Inter/Plus Jakarta Sans
- Critical CSS inline para above-the-fold

### SEO técnico

- `<title>` por página con keyword + "| 2N España"
- Meta description orientada al profesional, no al consumidor
- Open Graph con imagen de dispositivo 2N (crítico para sharing en LinkedIn)
- `lang="es"` en html root

---

## CHECKLIST ANTES DE PUBLICAR

```
□ ¿El hero tiene badge de credencial visible?
□ ¿Hay exactamente 2 CTAs en el hero?
□ ¿Todos los iconos son SVG (cero emojis)?
□ ¿Todas las cards tienen acento azul superior?
□ ¿Existe sección de casos de uso con proyectos reales?
□ ¿El formulario de contacto está visible antes del footer?
□ ¿La alternancia de fondos de sección es correcta?
□ ¿El copy menciona explícitamente al público objetivo (arquitectos/ingenieros/promotores)?
□ ¿Los CTAs usan vocabulario técnico?
□ ¿La web se ve bien en LinkedIn preview (Open Graph configurado)?
```

---

## REFERENCIAS DE DISEÑO (inspiración)

Consultar antes de empezar cualquier diseño nuevo:

- **dormakaba.com** — control de acceso B2B, tono correcto
- **avigilon.com** — dark mode + tech enterprise
- **linear.app** — animaciones, tipografía, spacing
- **axiscommunications.com** — coherencia corporativa (empresa madre de 2N)

---

*Este skill aplica a todas las páginas del proyecto specifications-solutions-2n.firebaseapp.com*  
*Autor: David Gastón Ortigosa · Prescripción Manager · 2N España*
