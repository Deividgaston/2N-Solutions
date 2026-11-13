# 0128 · Diseño y conversión de la web de soluciones

Implementación local en `encargo/0128-web-soluciones-diseno`, desde `ff2c6fa956866f6557d626c1240d22eab4c30683`. Sin publicación, nuevas imágenes, dependencias ni escrituras en Firestore. Especificación aplicada: `SPEC_WEB_2N_Prescripciones.md` (abril de 2026); las reglas del encargo de noviembre prevalecen sobre las propuestas antiguas de certificaciones, métricas e integraciones.

## Diseño y recorrido

- Portada: hero con audiencia profesional explícita, CTA de especificación y entrada por perfil. Tres tarjetas para arquitectura, ingeniería y promotoras/real estate, cada una con su consulta y perfil preseleccionado.
- Cinco sectores en una cuadrícula accesible sin GSAP: BTS, BTR, oficinas, hoteles y seguridad. Se elimina el desplazamiento horizontal fijado, que dejaba sectores fuera de la vista sin la biblioteca externa.
- Paleta roja del documento de David, textos secundarios legibles, foco de teclado, enlace de salto, movimiento reducido y tarjetas adaptadas a móvil.
- Las cinco verticales tienen titular, introducción y beneficios reales de respaldo; se mantienen si el contenido remoto falla. CTA superior y final al formulario con tipo y origen. Se conserva la descarga de dossier existente.
- Productos: selección técnica y CTA de consulta. Casos: tono concreto, acceso a consulta y filtro Retail retirado. Los casos remotos existentes siguen siendo la prueba social; no se inventan clientes, logotipos ni resultados.
- Retail: solo se elimina su enlace del pie de `solucion-retail.html`; el resto de ese fichero permanece idéntico. La regla compartida en `css/theme.css` también oculta el enlace del pie de `company.html` sin modificar esa página, incluso sin JS. `nav-controller.js` retira esos enlaces del DOM y cierra el menú móvil al navegar o pulsar Escape, con estado ARIA.
- `assets/web/` no existe en este checkout y está ignorado por Git. En las páginas autorizadas se sustituyen sus referencias por **recursos ya versionados**, sin crear imágenes: `assets/innovation_bg.jpg`, `assets/extracted_main_image.png`, logos blanco/azul. Las fotografías específicas de cada vertical quedan para otro encargo. Las imágenes decorativas tienen alt vacío; las de contenido, descripción.

## Formulario y contrato

Se mantiene el POST REST a `web_leads`, con estos únicos campos:

| Campo | Límite de validación JS | Uso |
|---|---:|---|
| name | 200 | Obligatorio; HTML limita además a 120 |
| email | 200 | Obligatorio y formato válido; HTML limita además a 160 |
| company | 200 | Opcional; HTML limita además a 160 |
| projectType | 50 | Perfil o sector del selector, sin valores externos arbitrarios |
| message | 2000 | Opcional |
| source | 50 | `landing` o página de origen de una lista cerrada |
| createdAt | timestamp | Fecha ISO en el formato REST existente |

Los perfiles utilizan `projectType`: `arquitectura`, `ingenieria`, `promotora`; los sectores conservan `bts`, `btr`, `office`, `hotel`, `security`, `otro`. No se añaden campos. Se usan `form.elements.namedItem` y límites explícitos, además de la validez nativa. Empresa y mensaje siguen siendo opcionales. Envío en curso bloqueado, timeout de 12 s, confirmación solo tras HTTP correcto y error visible con contacto alternativo; no se vacían datos al fallar. No hay promesa de respuesta en 24 h.

Las lecturas de Firestore se conservan: mismo `Promise.all` y mismas cuatro llamadas del renderizador, mismos dos GET REST de la portada. No se toca `js/services/`, `js/firebase-init.js`, reglas ni configuración. Los datos remotos siguen teniendo prioridad: esta rama corrige los respaldos, **no los textos de producción de `web_*`**.

## Antes y después por página

### index.html

| Elemento | Antes | Después |
|---|---|---|
| Descripción SEO | Intercomunicadores IP, videoporteros Full HD y control de acceso WaveKey para arquitectos, ingenieros y promotores. Red Dot Award. Certificado Axis Communications. | Videoporteros IP y control de acceso 2N para arquitectura, ingeniería y promotoras. Solicita especificaciones, documentación BIM y asesoramiento para tu proyecto. |
| Descripción social | Soluciones IP certificadas para proyectos residenciales, corporativos y hospitality. Red Dot Award Design. | Videoporteros IP y control de acceso para proyectos residenciales, oficinas y hoteles. Documentación técnica y apoyo a la prescripción. |
| Hero | Soluciones IP certificadas para proyectos residenciales, corporativos y hospitality . Videoporteros Full HD, acceso móvil WaveKey y tecnología respaldada por Axis Communications. | Videoporteros IP y control de acceso para viviendas, oficinas y hoteles . Define el acceso desde el primer plano, con documentación técnica y apoyo a la prescripción. |
| CTA secundario | Soluciones por sector | Encuentra tu perfil |
| Franja de evidencia | 30 + Años de innovación 100 + Países instalados 5 M+ Usuarios diarios 500 k+ Dispositivos globales 5 años Garantía estándar | 2N + Axis Parte de Axis Communications Red Dot Diseño de producto BIM Apoyo a la especificación IP SIP · ONVIF · APIs Casos Explorar proyectos reales → |
| Introducción sectores | Seis verticales, una misma plataforma IP. Elige tu sector y descubre la solución completa: equipos, arquitectura del sistema y argumentos de prescripción. | Del portal residencial al acceso de servicio. Elige el uso del edificio para revisar equipos, gestión e integraciones con el equipo de prescripción. |
| Perfil nuevo | Sin entrada por perfil | 01 / ARQUITECTURA Arquitectos y estudios Integra el acceso en el diseño. Define acabados, ubicación de equipos y documentación BIM desde las primeras decisiones. Solicitar especificación técnica → |
| Perfil nuevo | Sin entrada por perfil | 02 / INGENIERÍA Ingenierías e integradores Concreta la arquitectura IP, los protocolos y las interfaces con otros sistemas. Revisa la compatibilidad para tu instalación. Consultar una integración → |
| Perfil nuevo | Sin entrada por perfil | 03 / REAL ESTATE Promotoras y gestores Planifica accesos de residentes, visitas y mantenimiento. Compara las necesidades de venta, alquiler y explotación del edificio. Solicitar asesoramiento → |
| Tarjeta bts | 01 Residencial · Venta Residencial BTS Build-to-Sell. El videoportero que ayuda a vender viviendas: diseño premium que se nota en la visita al piso piloto. Ver solución ⟶ | 01 Residencial · Venta Residencial BTS Videoportero, acabados y atención de visitas integrados en el diseño de cada promoción. Ver solución ⟶ |
| Tarjeta btr | 02 Residencial · Inversión Residencial BTR Build-to-Rent. Gestión remota de accesos y rotación de inquilinos sin llaves físicas. Ver solución ⟶ | 02 Residencial · Inversión Residencial BTR Altas, bajas y permisos de acceso para residentes, visitas y mantenimiento. Ver solución ⟶ |
| Tarjeta oficinas | 03 Corporativo Oficinas Sedes corporativas, coworking y parques empresariales. Ver solución ⟶ | 03 Corporativo Oficinas Coordina recepción, empleados y visitas con la infraestructura IP del edificio. Ver solución ⟶ |
| Tarjeta hoteles | 04 Hospitality Hoteles Resorts, cadenas hoteleras y espacios boutique. Ver solución ⟶ | 04 Hospitality Hoteles Atiende llegadas y organiza accesos de huéspedes, personal y proveedores. Ver solución ⟶ |
| Tarjeta seguridad | 06 Seguridad Infraestructura Crítica Instalaciones gubernamentales, educación y sanidad. Acceso multifactor con auditoría completa. Ver solución ⟶ | 05 Seguridad Infraestructura Crítica Interfonía y control de acceso para educación, sanidad e instalaciones con requisitos específicos. Ver solución ⟶ |
| Por qué 2N | 01 Diseño Red Dot Award Estética premium que eleva la percepción de valor. Materiales nobles, acabados impecables en cada instalación. | 01 Diseño Red Dot Award Define acabados, montaje y ubicación del videoportero en coherencia con la entrada del edificio. |
| Por qué 2N | 02 Seguridad sin compromisos Encriptación end-to-end, autenticación multi-factor ISO 27001 y cumplimiento GDPR en todos los dispositivos. | 02 Funciones de ciberseguridad Funciones disponibles en los equipos, como 802.1X y SIPS, según modelo y configuración. Revísalas con el responsable de la red. |
| Por qué 2N | 03 WaveKey — Acceso móvil Abre puertas con el smartphone vía Bluetooth. Sin tarjetas físicas. Compatible con Apple Watch. | 03 WaveKey — Acceso móvil WaveKey permite acceso móvil en lectores compatibles y videoporteros con módulo Bluetooth. No está disponible en la manilla ni el cilindro Fortis. |
| Por qué 2N | 04 Integración total SIP, ONVIF y APIs abiertas. Integración nativa con los principales sistemas de control de acceso del mercado. | 04 Integraciones que se definen en proyecto SIP, ONVIF y APIs abiertas permiten plantear integraciones. Hay que verificar equipos, versiones y licencias en cada proyecto. |
| Por qué 2N | 05 Gestión cloud con My2N Administra dispositivos y videollamadas en remoto desde la nube: configuración, actualizaciones y soporte sin desplazamientos. | 05 Gestión cloud con My2N My2N permite gestionar equipos y videollamadas en remoto. Se reciben el 99,98 % de las llamadas que llegan a la app; es un dato de recepción, no de disponibilidad del servicio. |
| Por qué 2N | 06 5 años de garantía Confianza total respaldada por la garantía extendida estándar de 2N, líder en el sector IP. | 06 Planifica el mantenimiento Define con el equipo de prescripción el soporte, las actualizaciones y las condiciones de garantía aplicables a los equipos elegidos. |
| Por qué 2N | 07 ROI demostrable Reduce costes de mantenimiento y aumenta el valor percibido del inmueble con tecnología IP certificada. | 07 Decisiones para la explotación Compara gestión de credenciales, atención de visitas y mantenimiento para elegir una arquitectura adecuada al uso del inmueble. |
| Por qué 2N | 08 Instaladores certificados Red global de partners formados y certificados directamente por 2N en toda España. | 08 Instaladores certificados Consulta la red de instaladores certificados de 2N para planificar la puesta en marcha del proyecto. |
| Invitación a consulta | ¿Tienes un proyecto en mente? Solicita una consultoría gratuita con el equipo de prescripción 2N España. Te preparamos la especificación técnica, mediciones y documentación BIM para tu proyecto. O escríbenos directamente: gaston@2n.com · +34 660 204 003 | ¿Tienes un proyecto en mente? Cuéntanos qué estás diseñando. El equipo de prescripción 2N España te ayuda con la especificación técnica, las integraciones y la documentación de proyecto. O escríbenos directamente: gaston@2n.com · +34 660 204 003 |
| Selector | Selecciona… Residencial BTS Residencial BTR Oficinas Hotel Retail Infraestructura crítica Otro | Selecciona… Residencial BTS Residencial BTR Oficinas Hotel Arquitectura / Estudio Ingeniería / Integración Promotora / Real estate Infraestructura crítica Otro |
| Confirmación | Solicitud recibida. Te contactamos en menos de 24 h laborables. | Solicitud recibida. El equipo de prescripción se pondrá en contacto contigo. |
| Error de validación | Revisa el nombre, el email y el tipo de proyecto. | Revisa el nombre, el email y el perfil o tipo de proyecto. |
| Empresa | Empresa / Estudio | Empresa / Estudio (opcional) |
| Selector: etiqueta | Tipo de proyecto | Perfil o tipo de proyecto |
| Casos sin datos | Se oculta la sección completa | Explora los proyectos de referencia de 2N para ver aplicaciones en edificios residenciales, oficinas y hoteles. Consultar los casos de éxito → |

### solucion-bts.html

| Elemento | Antes | Después |
|---|---|---|
| Descripción SEO | Soluciones 2N para promociones residenciales de venta. Videoportero IP Style Red Dot Award, WaveKey y My2N para promotores BTS. Casos: Dunique, Torres Matiricos, Las Rosas Plaza. | Videoporteros IP y control de acceso para promociones residenciales de venta. Acabados, atención de visitas y documentación para la prescripción. |
| Titular | ... | Residencial BTS: el acceso forma parte del proyecto. |
| Subtítulo | ... | Videoporteros IP, atención de visitas y credenciales de acceso para promociones de vivienda en venta. Define equipos y acabados desde el diseño de la entrada. |
| Introducción | ... ... | Del plano al portal Coordina la ubicación del videoportero, las unidades interiores y los accesos comunes con la arquitectura de la promoción. El equipo de prescripción te ayuda a preparar la documentación técnica. |
| Beneficios | — | Diseño Acabados y montaje acordes con el portal. Visitas Llamadas a la vivienda y opciones de atención desde la app My2N. Acceso móvil WaveKey en lectores compatibles y videoporteros con módulo Bluetooth. |
| Integraciones | PMS Residencial Domótica (KNX, Z-Wave) Control4 / Savant Node-RED (Automatizaciones) VMS / CCTV ONVIF Sistemas contra incendios Ascensores (Schindler, KONE) Garaje robotizado Amazon Alexa / Google Home SDKs y APIs abiertas | Telefonía SIP Vídeo ONVIF APIs abiertas |

CTA nuevo en el hero: «Consultar este proyecto →». El CTA final conserva «Solicitar especificación técnica» y cambia de correo a `index.html?tipo=bts&origen=solucion-bts#contacto`. Las integraciones llevan una nota explícita de validación por equipo, versión, licencia e interfaz.

### solucion-btr.html

| Elemento | Antes | Después |
|---|---|---|
| Descripción SEO | Control de acceso IP 2N para edificios Build-to-Rent. Gestión multi-edificio, WaveKey y My2N para propietarios institucionales. Integración PMS. Caso: Propia Sants y Terrassa. | Interfonía IP y gestión de accesos para edificios de alquiler. Planifica permisos para residentes, visitas y mantenimiento con el equipo de prescripción. |
| Titular | ... | Accesos para un edificio que sigue cambiando. |
| Subtítulo | ... | Planifica altas, bajas y permisos de residentes, visitas y mantenimiento en promociones de alquiler y carteras residenciales. |
| Introducción | ... ... | Pensado para la operación diaria Separa los accesos comunes de las zonas de servicio y define quién gestiona cada credencial. Revisa la arquitectura IP y las integraciones con el software de gestión antes de especificar los equipos. |
| Beneficios | — | Gestión Define permisos según el uso de cada espacio. Rotación Planifica el alta y la retirada de credenciales. Fortis Manilla y cilindro sin acceso móvil Bluetooth; anunciados por 2N para 2026. |
| Integraciones | PMS Residencial (Mews, etc) Software de gestión BTR Taquillas inteligentes Domótica (KNX, BACnet) CCTV ONVIF Node-RED automatizaciones APIs REST abiertas Sistemas de incendios | Telefonía SIP Vídeo ONVIF APIs abiertas |

CTA nuevo en el hero: «Consultar este proyecto →». El CTA final conserva «Solicitar especificación técnica» y cambia de correo a `index.html?tipo=btr&origen=solucion-btr#contacto`. Las integraciones llevan una nota explícita de validación por equipo, versión, licencia e interfaz.

### solucion-oficinas.html

| Elemento | Antes | Después |
|---|---|---|
| Descripción SEO | Control de acceso IP 2N para sedes corporativas, coworking y parques empresariales. Integración SIP nativa, ONVIF, APIs abiertas ISO 27001. Caso: Oficinas Caser. | Interfonía IP y control de acceso para oficinas. Revisa arquitectura de red, atención de visitas e integración mediante protocolos y APIs. |
| Titular | ... | Recepción, empleados y visitas. Un acceso bien pensado. |
| Subtítulo | ... | Interfonía IP y control de acceso para oficinas, coworking y sedes corporativas. Coordina los equipos con la red y los sistemas del edificio. |
| Introducción | ... ... | Integra el acceso en tu infraestructura Define zonas, horarios y atención de visitas junto con el equipo de IT. Revisa interfaces, versiones y licencias para conectar interfonía, vídeo y gestión de accesos. |
| Beneficios | — | Recepción Atención de visitas desde los puntos previstos en el proyecto. Fichajes Integración con Factorial o cualquier sistema con API abierta, previa validación. Red Funciones como 802.1X y SIPS, según equipo y configuración. |
| Integraciones | Microsoft Teams Cisco CUCM / WebEx Avaya 3CX ONVIF (VMS/PSIM) Milestone / Genetec Lenel / Software House BMS (Siemens, Johnson) Node-RED automatizaciones REST APIs abiertas Active Directory / LDAP | Telefonía SIP Vídeo ONVIF APIs abiertas Factorial / sistemas con API abierta |
| Cierre | ¿Tienes un proyecto de oficinas? Nuestro equipo técnico analiza tu arquitectura IT existente y diseña la integración de control de accesos sin interrumpir los sistemas en producción. Documentación técnica y asistencia en obra incluidas. | ¿Tienes un proyecto de oficinas? Revisamos contigo la arquitectura IP y las interfaces de integración para preparar la especificación de accesos del edificio. |

CTA nuevo en el hero: «Consultar este proyecto →». El CTA final conserva «Solicitar especificación técnica» y cambia de correo a `index.html?tipo=office&origen=solucion-oficinas#contacto`. Las integraciones llevan una nota explícita de validación por equipo, versión, licencia e interfaz.

### solucion-hoteles.html

| Elemento | Antes | Después |
|---|---|---|
| Descripción SEO | Videoportero IP y control de accesos 2N para hoteles, resorts y hospitality. Check-in sin llave, integración PMS, zonas de refugio. Caso: Hotel Four Seasons, Hotel Brach. | Interfonía IP y control de acceso para hoteles. Define llegadas, accesos de servicio e integraciones con las interfaces disponibles. |
| Titular | La experiencia del huésped empieza en el acceso. | La experiencia del huésped empieza en el acceso. |
| Subtítulo | El check-in sin llave, el videoportero Full HD y la integración PMS definen la percepción de lujo del cliente hotelero desde el primer momento. 2N lo hace posible y elegante. | Interfonía IP y control de acceso para llegadas, zonas comunes y entradas de servicio. Estudia la conexión con el PMS según las interfaces disponibles. |
| Introducción | ... ... | Cada acceso tiene un uso distinto Coordina recepción, huéspedes y proveedores sin confundir el acceso a zonas comunes con las cerraduras de las habitaciones. Valida con el integrador el alcance del PMS y las credenciales elegidas. |
| Beneficios | — | Llegadas Atención de visitas mediante interfonía IP. Servicio Define permisos para personal y proveedores. Compatibilidad Integraciones y licencias por verificar en cada instalación. |
| Integraciones | Opera PMS Mews Protel Cloudbeds ONVIF VMS BMS (Building Management) Sistemas contra incendios Domótica habitación Telefonía SIP / Teams APIs abiertas REST | Telefonía SIP Vídeo ONVIF APIs abiertas |

CTA nuevo en el hero: «Consultar este proyecto →». El CTA final conserva «Solicitar especificación técnica» y cambia de correo a `index.html?tipo=hotel&origen=solucion-hoteles#contacto`. Las integraciones llevan una nota explícita de validación por equipo, versión, licencia e interfaz.

### solucion-seguridad.html

| Elemento | Antes | Después |
|---|---|---|
| Descripción SEO | Control de acceso IP 2N para infraestructura crítica, universidades, hospitales y edificios gubernamentales. ISO 27001, TLS 1.3, zonas de refugio normativas. Caso: UDIT, Edificios Ampans. | Interfonía IP y control de acceso para educación, sanidad e instalaciones con requisitos específicos. Funciones 802.1X y SIPS según equipo y configuración. |
| Titular | ... | Define quién entra. Y cómo se atiende cada acceso. |
| Subtítulo | ... | Interfonía IP y control de acceso para educación, sanidad e instalaciones con requisitos específicos. Cada proyecto necesita su análisis de riesgos e integración. |
| Introducción | ... ... | Funciones concretas, requisitos definidos Selecciona equipos y configura permisos con los responsables del edificio y de la red. Las funciones del dispositivo contribuyen a la solución; la conformidad del proyecto requiere una evaluación propia. |
| Beneficios | — | Red 802.1X según equipo y configuración. Comunicaciones SIPS según equipo y configuración. Operación Permisos y atención de accesos definidos para cada zona. |
| Integraciones | Active Directory / LDAP PSIM (Lenel, Genetec) Sistemas de incendios CCTV ONVIF Control4 / BMS Ascensores SIP / PBX Node-RED REST APIs abiertas Microsoft Teams | Telefonía SIP Vídeo ONVIF APIs abiertas |
| Cierre | ¿Tienes un proyecto de infraestructura crítica? Nuestro equipo de prescripción técnica tiene experiencia en los requisitos normativos de educación, sanidad e instituciones gubernamentales. Te acompañamos desde la especificación hasta la certificación del proyecto. | ¿Tienes un proyecto de infraestructura crítica? Revisamos los requisitos de acceso con tu equipo para seleccionar equipos e interfaces. La evaluación normativa y de riesgos corresponde a los responsables del proyecto. |
| Funciones | 🔐 ISO 27001 Gestión de seguridad de la información certificada en todos los procesos de 2N. | 01 802.1X Autenticación de equipos en la red, disponible según modelo y configuración. |
| Funciones | 🛡️ TLS 1.3 End-to-End Toda comunicación entre dispositivos y cloud cifrada con el protocolo más actualizado. | 02 SIPS Señalización SIP protegida según equipo, infraestructura y configuración. |
| Funciones | 🇪🇺 GDPR Compliant Gestión de datos de identidad y acceso conforme a reglamento europeo de protección de datos. | 03 Permisos de acceso Define usuarios, zonas y horarios de acceso con los responsables de la instalación. |

CTA nuevo en el hero: «Consultar este proyecto →». El CTA final conserva «Solicitar especificación técnica» y cambia de correo a `index.html?tipo=security&origen=solucion-seguridad#contacto`. Las integraciones llevan una nota explícita de validación por equipo, versión, licencia e interfaz.

### productos.html

| Elemento | Antes | Después |
|---|---|---|
| Badge | Tecnología de Vanguardia | Equipos para tu proyecto |
| Descripción | La gama más completa de intercomunicadores, sistemas de acceso y unidades de respuesta del mundo. Diseñados para integrarse en la arquitectura moderna. | Compara videoporteros IP, lectores, unidades interiores y software. Valida modelos, licencias y compatibilidad antes de incorporarlos a tu especificación. |
| CTA nuevo | Sin consulta en hero | Consultar la selección de equipos → |

### casos-exito.html

| Elemento | Antes | Después |
|---|---|---|
| Badge | Referencia Mundial en Intercomunicación | Referencias para la prescripción |
| Descripción | Descubre cómo arquitectos y promotores de todo el mundo utilizan la tecnología 2N para elevar la seguridad y el diseño de sus edificios más emblemáticos. | Explora aplicaciones de interfonía IP y control de acceso en proyectos residenciales, oficinas y hoteles. Consulta con el equipo cómo trasladarlas a tu edificio. |
| Cifra sin respaldo | +150 · Países con presencia | Proyectos · Referencias por tipo de edificio |
| Descripción IP | Líderes en tecnología IP | Interfonía y acceso IP |
| Filtro | Retail | Retirado del selector |
| Consulta | Contactar Especialista → correo | Contactar Especialista → index.html?origen=casos-exito#contacto |

### Compartido

| Antes | Después |
|---|---|
| «Líder europeo en intercomunicación IP y control de acceso para proyectos residenciales, corporativos y hospitality.» | «Interfonía IP y control de acceso para proyectos residenciales, oficinas y hoteles.» |
| Retail en pie/galería | Retirado de menús, galería, selector de consulta y filtro de casos; la página no se reescribe. |
| Esqueletos o instrucciones «Añade contenidos desde el panel de administración» sin datos | Resumen estático útil, contacto y estado público; se ocultan bloques de productos/casos vacíos. |
| «No se pudo enviar…» | «No se pudo confirmar el envío. Escríbenos a gaston@2n.com o inténtalo de nuevo.» |

Se retiran o se generalizan, sin inventar sustitutos técnicos: Full HD, certificación genérica Axis, cifrado universal end-to-end/TLS 1.3, cumplimiento GDPR de todos los equipos, Apple Watch, certificación de proyecto, integraciones nativas/certificadas con marcas concretas y cifras de usuarios/dispositivos/países sin fuente local. El conocimiento del encargo sustenta 802.1X/SIPS como funciones disponibles según equipo y configuración, acceso móvil con módulo Bluetooth, exclusión de manilla/cilindro Fortis, recepción My2N del 99,98 % y fichajes con Factorial/sistemas con API abierta.

## Pendiente de Firestore y otros encargos

- Revisar y publicar por separado, con autorización, `web_metadata/textos.why`, metadatos/beneficios/introQuote y secciones de `web_verticals`, `web_products` y `web_cases`. Los textos remotos pueden volver a mostrar afirmaciones antiguas y prevalecen sobre estos respaldos.
- Confirmar y aplicar `isActive: false` de Retail en contenido remoto desde NEXO. Aquí se retira la navegación local, sin modificar datos ni su ficha.
- Fotografías por sección: flujo Drive → biblioteca NEXO o nuevos recursos versionados en otro encargo. Las dos fotografías locales reutilizadas aquí no se presentan como instalaciones de clientes concretos.
- No se han consultado leads reales ni se ha enviado ningún contacto a producción. Los casos de las pruebas son ficticios.
- El `firestore.rules` de este repo no contiene `web_leads`; no se modifica ni se intenta desplegar. El contrato usado es el autorizado expresamente en el encargo. Reglas desplegadas y escritura real: NO VERIFICADAS sin red.

## Verificación

`js/tests/0128.test.cjs` ejecuta controladores reales en VM con DOM y respuestas simuladas, sin red ni dependencias añadidas. Comprueba perfiles, contrato y límites, validación, error HTTP/offline, timeout, bloqueo de doble clic, respaldos, prioridad remota, menú móvil, textos y recursos locales.

`js/tests/0128.browser.cjs` deja preparado el recorrido Playwright de ocho páginas a 320, 390 y 1440 px, perfiles/formulario/menú y respaldos. Intercepta **todas** las peticiones: datos ficticios, SDK de Firebase y exportador PDF sustituidos; ningún acceso real a Firebase ni CDNs. Las capturas se escribirían en `/tmp/nexo-0128-e2e`. Exportación PDF y animaciones con CDN real quedan fuera de esta prueba.

El intento de Playwright en este aislamiento falla antes de abrir una página: `sandbox_host_linux.cc:41 · shutdown: Operation not permitted (1)`. **No hay capturas ni validación visual confirmada**. Se registra como fallo por aislamiento para la revisión de Claude, según la instrucción de esta vuelta. Log: `/tmp/nexo-0128-playwright.log`.

El proyecto es HTML/CSS/JS sin compilación ni tipos configurados. `npm test` contiene el marcador original «Error: no test specified»; no es una suite existente. La suite añadida se ejecuta directamente con Node. No se instala software ni se cambia `package.json`.

Comandos de verificación (con tiempo máximo):

```sh
timeout 60s node js/tests/0128.test.cjs
timeout 30s bash -c 'for file in js/home.js js/nav-controller.js js/vertical-renderer.js js/tests/0128.test.cjs js/tests/0128.browser.cjs; do node --check "$file" || exit; done'
PLAYWRIGHT_MODULE_PATH=/ruta/al/playwright/ya/instalado timeout 2m node js/tests/0128.browser.cjs
```

La revisión de nivel 1 corresponde a Claude después de la entrega. Esta rama no se integra ni se publica. Rollback: descartar la rama mediante el flujo de Dirección.

Resultados de esta vuelta: suite Node **31/31**, 0 fallos, 0 omitidas; sintaxis JS **5/5**; estructura HTML **8/8** e IDs únicos; parseo CSS de ambos ficheros tocados y estilos inline de ocho páginas correcto. Contrastes principales calculados: blanco/rojo **4,70:1**, texto secundario/tarjeta **9,37:1**, enlaces/tarjeta **8,20:1**, etiquetas/tarjeta **10,86:1**, placeholder/campo **8,59:1**. Control de alcance: **17 ficheros permitidos**, Retail solo un enlace eliminado, archivos prohibidos intactos y `git diff --check` limpio. Tras retirar los estilos inline de las fotos de las tarjetas, se revalida únicamente la comprobación de recursos locales (1/1). Log de la suite: `/tmp/nexo-0128-tests.log`. La prueba visual permanece sin confirmar por el aislamiento indicado arriba.
