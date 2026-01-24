/**
 * 2N Presenter - PowerPoint Generation Service
 * Generates native .pptx files using PptxGenJS
 */

class PPTService {
    constructor() {
        this.companyInfo = {
            description: "Desde 1991, 2N ha liderado la innovación en telecomunicaciones y control de acceso. Hoy, como parte del grupo Axis Communications, definimos el estándar mundial en seguridad y diseño.",
            innovation: "2N es una empresa líder mundial en el desarrollo y fabricación de sistemas de control de acceso e intercomunicadores IP. Nuestros productos se encuentran en los edificios más emblemáticos del mundo.",
            stats: [
                { val: "30+", label: "Años de Historia" },
                { val: "No.1", label: "IP Intercoms" },
                { val: "100+", label: "Países" }
            ],
            features: [
                { title: "Calidad Premium", desc: "Diseño europeo y fabricación propia." },
                { title: "Innovación Continua", desc: "14% de ingresos invetidos en I+D." },
                { title: "Soporte Global", desc: "Presencia en más de 100 países." }
            ]
        };
    }

    async generatePresentation(verticalName, data) {
        if (typeof PptxGenJS === 'undefined') {
            alert("Error: PptxGenJS library not loaded.");
            return;
        }

        const pres = new PptxGenJS();
        pres.layout = 'LAYOUT_16x9';
        pres.author = '2N Solutions';
        pres.company = '2N Telekomunikace a.s.';
        pres.title = `Dossier 2N - ${verticalName}`;

        // Define Masters
        this.defineMasters(pres);

        // SLIDE 1: COVER
        this.createCoverSlide(pres, verticalName, data.verticalLabel);

        // SLIDE 2: COMPANY INFO
        this.createCompanySlide(pres);

        // SLIDE 3: INTRO (Dynamic)
        this.createIntroSlide(pres, data, verticalName);

        // SLIDE 4+: DYNAMIC SECTIONS
        if (data.dynamicSections && data.dynamicSections.length > 0) {
            this.createDetailSlides(pres, data.dynamicSections, verticalName);
        }

        // Export
        await pres.writeFile({ fileName: `Dossier_2N_${verticalName.replace(/\s+/g, '_')}.pptx` });
    }

    defineMasters(pres) {
        // Master Slide with Black Background
        pres.defineSlideMaster({
            title: 'MASTER_DARK',
            background: { color: '000000' },
            objects: [
                // Footer
                { text: { text: '2N Solutions', options: { x: 0.5, y: '92%', w: 3, h: 0.5, fontSize: 10, color: '666666' } } },
                { text: { text: '2n.com', options: { x: 10, y: '92%', w: 3, h: 0.5, fontSize: 10, color: '666666', align: 'right' } } }
            ]
        });
    }

    createCoverSlide(pres, title, label) {
        const slide = pres.addSlide({ masterName: 'MASTER_DARK' });

        // Background Image (if available, otherwise dark gradient simulation)
        // Note: For simplicity, we just use text over black, or we can try to load the banner image.
        slide.background = { color: '000000' };

        // 2N Logo
        slide.addImage({ path: 'assets/2N_Logo_RGB_White.png', x: 0.5, y: 0.5, w: 1.5, h: 0.5 });

        // Label
        slide.addText(label || 'SOLUCIÓN', {
            x: 0.5, y: 3.5, w: 4, h: 0.5,
            fontSize: 12, color: '000000', fill: 'FFFFFF', align: 'center', bold: true
        });

        // Title
        slide.addText(title, {
            x: 0.5, y: 4.2, w: 9, h: 1.5,
            fontSize: 48, color: 'FFFFFF', bold: true, fontFace: 'Arial'
        });

        // Subtitle
        slide.addText("Manual de Soluciones y Especificaciones Técnicas", {
            x: 0.5, y: 5.8, w: 10, h: 0.5,
            fontSize: 18, color: 'CCCCCC'
        });
    }

    createCompanySlide(pres) {
        const slide = pres.addSlide({ masterName: 'MASTER_DARK' });

        slide.addText("PROPUESTA DE VALOR", { x: 0.5, y: 0.5, fontSize: 10, color: '666666', bold: true });
        slide.addText("El Estándar 2N", { x: 0.5, y: 1.0, fontSize: 32, color: 'FFFFFF', bold: true });

        // Description
        slide.addText(this.companyInfo.description, {
            x: 0.5, y: 2.0, w: 12, h: 1,
            fontSize: 14, color: 'CCCCCC', align: 'justify'
        });

        // Innovation / Stats
        slide.addText("Liderazgo Global", { x: 0.5, y: 3.5, fontSize: 18, color: 'FFFFFF', bold: true });
        slide.addText(this.companyInfo.innovation, {
            x: 0.5, y: 4.0, w: 8, h: 1,
            fontSize: 12, color: 'BBBBBB', align: 'justify'
        });

        // Stats Row
        this.companyInfo.stats.forEach((stat, idx) => {
            const xPos = 0.5 + (idx * 2.5);
            slide.addText(stat.val, { x: xPos, y: 5.2, fontSize: 24, color: 'FFFFFF', bold: true });
            slide.addText(stat.label, { x: xPos, y: 5.7, fontSize: 10, color: '888888' });
        });

        // Feature Cards (Simulated with Shapes)
        const ftY = 6.5;
        this.companyInfo.features.forEach((ft, idx) => {
            const xPos = 0.5 + (idx * 4.2);
            // Card BG
            slide.addShape(pres.ShapeType.rect, { x: xPos, y: ftY, w: 4, h: 1.5, fill: '111111', line: '333333' });
            // Text
            slide.addText(ft.title, { x: xPos + 0.2, y: ftY + 0.2, fontSize: 14, color: '3b82f6', bold: true });
            slide.addText(ft.desc, { x: xPos + 0.2, y: ftY + 0.6, w: 3.6, fontSize: 11, color: '999999' });
        });
    }

    createIntroSlide(pres, data, verticalName) {
        const slide = pres.addSlide({ masterName: 'MASTER_DARK' });

        slide.addText("INTRODUCCIÓN", { x: 0.5, y: 0.5, fontSize: 10, color: '666666', bold: true });
        slide.addText(data.mainTitle || 'Solución 2N', { x: 0.5, y: 1.0, fontSize: 32, color: 'FFFFFF', bold: true });

        // Intro Text (Join paragraphs)
        const textContent = data.mainIntro.join('\n\n');
        slide.addText(textContent, {
            x: 0.5, y: 2.0, w: 12, h: 3,
            fontSize: 14, color: 'CCCCCC', align: 'justify', valign: 'top'
        });

        // Benefits
        if (data.benefits && data.benefits.length > 0) {
            slide.addText("Capacidades Clave", { x: 0.5, y: 5.2, fontSize: 18, color: '3b82f6', bold: true });

            data.benefits.forEach((b, i) => {
                slide.addText(b, {
                    x: 1.0, y: 5.8 + (i * 0.4), w: 11, h: 0.4,
                    fontSize: 12, color: 'DDDDDD', bullet: { code: '2713', color: '3b82f6' }
                });
            });
        }
    }

    createDetailSlides(pres, sections, verticalName) {
        sections.forEach((section, i) => {
            const slide = pres.addSlide({ masterName: 'MASTER_DARK' });

            slide.addText("DETALLE TÉCNICO", { x: 0.5, y: 0.5, fontSize: 10, color: '666666', bold: true });

            // Image Left or Center strategy
            if (section.imageUrl) {
                // Image
                slide.addImage({ path: section.imageUrl, x: 0.5, y: 1.2, w: 6, h: 4.5, sizing: { type: 'contain', w: 6, h: 4.5 } });

                // Text Right
                slide.addText(section.title || 'Detalle', { x: 7, y: 1.2, w: 6, fontSize: 24, color: 'FFFFFF', bold: true });
                slide.addText(section.text, { x: 7, y: 2.0, w: 6, h: 5, fontSize: 14, color: 'CCCCCC', align: 'justify', valign: 'top' });
            } else {
                // Full Width Text
                slide.addText(section.title || 'Detalle', { x: 0.5, y: 1.2, w: 12, fontSize: 24, color: 'FFFFFF', bold: true });
                slide.addText(section.text, { x: 0.5, y: 2.0, w: 12, h: 5, fontSize: 14, color: 'CCCCCC', align: 'justify' });
            }

            // Page Number
            slide.addText(`Page ${4 + i}`, { x: 12, y: '92%', fontSize: 9, color: '666666' });
        });
    }
}

export const pptService = new PPTService();
