# SPEC: Rediseño Web — specifications-solutions-2n.firebaseapp.com
**Autor:** David Gastón Ortigosa · Prescripción Manager · 2N España  
**Fecha:** Abril 2026  
**Destino:** Antigravity (agente de desarrollo)  
**URL actual:** https://specifications-solutions-2n.firebaseapp.com/index.html

---

## 1. Contexto y objetivo

Esta web es una herramienta de prescripción B2B dirigida a **arquitectos, ingenierías y real estate** (promotores BTS/BTR, facility managers, property managers). No es una web de venta directa al consumidor.

**Objetivo primario:** Que un arquitecto o promotor que llegue a la web entienda en menos de 10 segundos que 2N es la solución de referencia técnica y estética para su proyecto, y solicite especificaciones o contacte con el prescriptor.

**Problema actual:** La web tiene buen contenido pero diseño genérico, estructura plana, sin jerarquía visual de conversión, sin prueba social B2B, y sin CTAs adaptados al decisor técnico.

---

## 2. Público objetivo (Buyer Personas)

| Perfil | Pain principal | CTA esperado |
|---|---|---|
| Arquitecto / estudio de arquitectura | Necesita documentación técnica (DWG, PDF especificación) | Descargar especificación técnica |
| Promotora BTS/BTR | ROI, diferenciación del proyecto, normativa | Solicitar consultoría |
| Ingeniería instaladora | Integración, APIs, compatibilidad | Acceder a área técnica |
| Property Manager / Real Estate | Gestión remota, escalabilidad | Ver demo My2N |

---

## 3. Arquitectura de la página (index.html)

### 3.1 Hero — Impacto inmediato

**Qué cambiar:**
- Fondo: vídeo corto en loop (o imagen de alta calidad) de un edificio premium con videoportero 2N instalado. Referencia visual: lobbies de lujo, fachadas arquitectónicas.
- Headline actual: *"Prescribe el futuro. Diseña el acceso."* → **Mantener** (es bueno).
- Subheadline: Añadir una línea específica B2B:  
  `"Soluciones IP certificadas para proyectos residenciales, corporativos y hospitality. Red Dot Award Design."`
- **CTAs duales visibles en el hero:**
  - Primario: `Solicitar especificación técnica` → enlaza a formulario de contacto/prescriptor
  - Secundario: `Ver soluciones por sector` → ancla a sección verticals

**Diseño visual hero:**
- Fondo oscuro o imagen arquitectónica a pantalla completa
- Logo 2N blanco top-left
- Nav horizontal limpia: Soluciones · Sobre 2N · Área Prescriptores
- Badge/chip destacado: `🏆 Red Dot Award` visible en el hero

---

### 3.2 Trust Bar — Inmediatamente bajo el hero

Barra horizontal con logos de clientes / proyectos referencia o partners. Ejemplo:
```
[ Logo promotora 1 ] [ Logo estudio arquitectura ] [ Logo ingeniería ] [ Logo hotel ] [ Axis Communications ]
```
Si no hay logos disponibles, usar cifras con iconos:
- **30+ años** liderando interfonía IP
- **100+ países**
- **5M+ usuarios activos**
- **500K+ dispositivos instalados** *(corregir el dato actual "500+" que parece erróneo)*

---

### 3.3 Sección Verticals — Rediseño de tarjetas

**Problema actual:** Emojis como iconos (🏠🏢) son poco profesionales para B2B.

**Mejora:**
- Sustituir emojis por iconos SVG minimalistas o fotografías reales de instalaciones 2N
- Cada tarjeta: imagen de fondo real + overlay oscuro + título + descripción de 1 línea + CTA `Ver solución →`
- Añadir hover effect: ligero zoom en imagen + aparición de CTA
- Orden: Residencial BTS · BTR · Oficinas · Hoteles · Retail · Seguridad

---

### 3.4 Sección "Por qué 2N" — Rediseño con evidencia

**Problema actual:** Los argumentos son textos sin soporte visual ni datos.

**Mejora por argumento:**

| Argumento actual | Mejora propuesta |
|---|---|
| Diseño Red Dot Award | Mostrar imagen del award badge + foto de producto instalado |
| Seguridad sin compromisos | Icono shield + mención RGPD + ISO 27001 |
| Acceso móvil nativo (WaveKey) | GIF/vídeo corto del app funcionando |
| Integración total | Diagrama simple: 2N ↔ BMS ↔ CCTV ↔ KNX |
| My2N cloud | Screenshot de dashboard My2N |
| ROI demostrable | Número concreto: "Reduce costes de mantenimiento hasta un 40%" |
| 5 años garantía | Badge visual destacado |
| Instaladores certificados | Enlace al mapa de instaladores 2N |

Layout recomendado: **grid 2 columnas** en desktop, 1 columna en mobile. Cada ítem: icono izquierda + texto derecha.

---

### 3.5 Nueva sección: Casos de uso / Proyectos referencia

**No existe actualmente — CREAR.**

Contenido: 2-3 tarjetas de proyecto tipo case study:
```
[ Imagen fachada edificio ]
Tipo: Residencial BTR · 120 viviendas · Madrid
Solución: IP Verso + My2N + Access Commander
Resultado: Apertura 100% móvil, 0 llaves físicas
[ Leer más → ]
```
Si no hay casos reales, usar proyectos genéricos con fotografías de stock arquitectónico de calidad.

---

### 3.6 Sección CTA final — Conversión

**Problema actual:** El footer tiene muy poco peso de conversión.

**Añadir antes del footer:**

```
──────────────────────────────────────────
  ¿Tienes un proyecto en mente?
  Solicita una consultoría gratuita con nuestro equipo de prescripción.
  
  [ Nombre ] [ Email ] [ Tipo de proyecto ▼ ]
  [ Enviar solicitud ]
  
  o escríbenos directamente: prescripcion@2n.com
──────────────────────────────────────────
```

---

### 3.7 Footer

- Logo 2N
- Links: Soluciones · Área Prescriptores · 2N.com · Política de privacidad
- Badge: "Parte de Axis Communications" con logo Axis
- Copyright actualizado a 2025

---

## 4. Diseño visual — Sistema de diseño

### Paleta de colores
```css
--color-primary: #E8002D;        /* Rojo 2N corporativo */
--color-primary-dark: #B80024;   /* Hover estados */
--color-bg-dark: #0A0A0A;        /* Fondo secciones oscuras */
--color-bg-mid: #111827;         /* Alternancia secciones */
--color-bg-light: #F9FAFB;       /* Secciones claras */
--color-text-primary: #FFFFFF;   /* Texto sobre oscuro */
--color-text-dark: #111827;      /* Texto sobre claro */
--color-text-muted: #9CA3AF;     /* Texto secundario */
--color-border: #1F2937;         /* Bordes sutiles */
--color-accent: #E8002D20;       /* Glow rojo suave */
```

### Tipografía
- **Heading:** `Inter` o `Plus Jakarta Sans` — weight 700/800
- **Body:** `Inter` — weight 400/500
- Tamaños: H1 → 56px desktop / 36px mobile · H2 → 36px · Body → 16px

### Estilo general
- Dark mode predominante (transmite premium y tech)
- Bordes sutiles `border: 1px solid var(--color-border)`
- Cards con `backdrop-filter: blur(10px)` sobre fondos oscuros (glassmorphism moderado)
- Sombras: `box-shadow: 0 4px 24px rgba(232,0,45,0.08)` — rojo muy sutil
- Border radius: `12px` en cards, `8px` en botones
- Animaciones: entrada con `fade-in + translateY(20px)` suave al scroll

### Botones
```css
/* Primario */
background: #E8002D; color: white; border-radius: 8px; padding: 14px 28px;
font-weight: 600; transition: background 0.2s;

/* Secundario */
background: transparent; border: 1px solid #E8002D; color: #E8002D;
```

---

## 5. Navegación y estructura de páginas

```
index.html          ← Landing principal (este documento)
company.html        ← Sobre 2N
solucion-bts.html   ← Residencial BTS
solucion-btr.html   ← Residencial BTR
solucion-oficinas.html
solucion-hoteles.html
solucion-retail.html
solucion-seguridad.html
login.html          ← Área prescriptores (privada)
```

**Navegación desktop:** Sticky header con blur al hacer scroll (`backdrop-filter: blur(20px)`)  
**Navegación mobile:** Hamburger menu con slide-in lateral

---

## 6. Rendimiento y SEO básico

- Imágenes: formato WebP, lazy loading
- Meta tags: `<title>` y `<description>` optimizados por página
- Open Graph: imagen preview para LinkedIn sharing (crítico para prescriptores)
- Favicon: logo 2N
- `lang="es"` en `<html>`

---

## 7. Funcionalidades específicas para prescriptores

- **Área privada** (`/login.html`): autenticación existente — mantener y mejorar UI
- **Descarga de documentos técnicos:** DWG, PDF especificación, BIM objects
- **Formulario de prescripción:** captura nombre, empresa, tipo proyecto, nº unidades, email
- **Idiomas:** ES / EN (estructura ya existe, asegurar consistencia)

---

## 8. Prioridades de implementación

| Prioridad | Tarea |
|---|---|
| 🔴 Alta | Rediseño hero con imagen premium + CTAs duales |
| 🔴 Alta | Sustitución emojis por iconos SVG en verticals |
| 🔴 Alta | Formulario de contacto/prescripción visible |
| 🟡 Media | Trust bar con logos o cifras |
| 🟡 Media | Sección "Por qué 2N" con soporte visual |
| 🟡 Media | Nueva sección casos de uso |
| 🟢 Baja | Optimización SEO y Open Graph |
| 🟢 Baja | Mejora footer |

---

## 9. Referencias de diseño (inspiración)

- **Dormakaba.com** — referencia en control de acceso B2B
- **Avigilon.com** — dark mode + tech + enterprise
- **Linear.app** — animaciones suaves, tipografía fuerte
- **Axis Communications** — coherencia corporativa (empresa madre)

---

*Documento generado para uso interno de prescripción 2N España.*  
*Contacto: David Gastón Ortigosa — Prescripción Manager — 2N España*
