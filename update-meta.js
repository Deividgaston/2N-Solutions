const urlOf = (id) => `https://firestore.googleapis.com/v1/projects/nsoluciones-68554/databases/(default)/documents/verticals/${id}?updateMask.fieldPaths=heroTitle&updateMask.fieldPaths=heroSubtitle&updateMask.fieldPaths=badgeText&updateMask.fieldPaths=introTitle&updateMask.fieldPaths=introText`;

const fetchOpts = (data) => ({
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        fields: {
            heroTitle: { stringValue: data.heroTitle || '' },
            heroSubtitle: { stringValue: data.heroSubtitle || '' },
            badgeText: { stringValue: data.badgeText || '' },
            introTitle: { stringValue: data.introTitle || '' },
            introText: { stringValue: data.introText || '' }
        }
    })
});

const updates = {
    bts: {
        badgeText: 'RESIDENCIAL · BUILD TO SELL (BTS)',
        heroTitle: 'El videoportero que ayuda a vender viviendas.',
        heroSubtitle: 'Diseño premium, tecnología WaveKey y funciones avanzadas que diferencian tu promoción inmobiliaria en la visita al piso piloto.',
        introTitle: 'El reto del Build to Sell',
        introText: 'En la promoción inmobiliaria de alto standing (BTS), el videoportero es a menudo el primer elemento tecnológico que el comprador potencial toca y experimenta durante su visita. Una estética premium y funcionalidades modernas no solo protegen el acceso, sino que elevan la percepción de valor de toda la promoción.'
    },
    btr: {
        badgeText: 'RESIDENCIAL · BUILD TO RENT (BTR)',
        heroTitle: 'Control total del edificio, sin estar en el edificio.',
        heroSubtitle: 'Gestión remota de miles de inquilinos, accesos comunes y rotación instantánea. Reduce los costes operativos de tu cartera BTR con la tecnología en la nube de 2N.',
        introTitle: 'El reto del Build to Rent',
        introText: 'La rentabilidad de un activo BTR depende de la máxima optimización de sus costes operativos (OPEX). Desplazar técnicos para entregar llaves físicas o dar de baja a un inquilino no es escalable. 2N transforma los accesos en un servicio gestionado de forma remota, 100% digital y sin contacto.'
    },
    office: {
        badgeText: 'CORPORATIVO · OFICINAS Y PARQUES EMPRESARIALES',
        heroTitle: 'Control de acceso que habla con tus sistemas.',
        heroSubtitle: 'SIP nativo, ONVIF, APIs REST abiertas y +300 integraciones. 2N se adapta a cualquier arquitectura IT corporativa sin reemplazar la infraestructura existente.',
        introTitle: 'El reto del entorno corporativo',
        introText: 'Las sedes corporativas requieren soluciones de control de acceso que se integren con los sistemas IT y de comunicaciones existentes, soporten múltiples sedes y ofrezcan trazabilidad de auditoría completa.\\n\\n2N es el única plataforma de videoportero IP con integración SIP nativa para conectar directamente con cualquier centralita Cisco, Avaya o Microsoft Teams. El equipo de seguridad y recepción recibe las llamadas en sus extensiones IP sin infraestructura adicional.\\n\\nCon Node-RED integrado en los dispositivos 2N, el responsable de IT puede crear automatizaciones personalizadas, conectar APIs de terceros e integrar escenarios BMS complejos sin modificar el hardware.'
    },
    hotel: {
        badgeText: 'HOSPITALITY · HOTELES Y APARTAMENTOS TURÍSTICOS',
        heroTitle: 'La primera impresión de tus huéspedes.',
        heroSubtitle: 'Intercomunicadores de alta visibilidad, acceso móvil WaveKey y lectores resistentes. Asegura el flujo continuo en el lobby, recepción y zonas de empleados.',
        introTitle: 'El reto de la hotelería',
        introText: 'En el sector hotelero, la seguridad y la experiencia del huésped van de la mano. Los videoporteros y lectores de acceso 2N se integran con los principales sistemas de gestión hotelera (PMS) para automatizar el acceso a las habitaciones, áreas comunes y zonas restringidas, eliminando el uso de tarjetas físicas.'
    },
    security: {
        badgeText: 'SEGURIDAD CRÍTICA · INSTALACIONES DE ALTO RIESGO',
        heroTitle: 'Resistencia extrema para escenarios críticos.',
        heroSubtitle: 'Protección IK10, audio HD de disuasión y redundancia total. La elección táctica para banca, centros penitenciarios y espacios públicos.',
        introTitle: 'El reto de la seguridad crítica',
        introText: 'Las infraestructuras críticas requieren intercomunicadores que resistan vandalismo severo y garanticen la comunicación en emergencias. 2N ofrece equipos con protección IK10+, micrófonos duales y alta potencia de audio (10W), permitiendo tanto la intercomunicación nítida como la emisión de mensajes de disuasión vinculados al circuito CCTV mediante ONVIF.'
    }
};

(async () => {
    for (const [id, data] of Object.entries(updates)) {
        try {
            const res = await fetch(urlOf(id), fetchOpts(data));
            if (!res.ok) {
                const text = await res.text();
                console.error(`Error updating ${id}:`, text);
            } else {
                console.log(`Successfully updated ${id}`);
            }
        } catch (err) {
            console.error(`Fetch error for ${id}:`, err);
        }
    }
})();
