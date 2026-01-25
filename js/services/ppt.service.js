
import { db } from '../firebase-init.js';

class PptService {
    constructor() {
        this.pptx = null;
    }

    async init() {
        if (typeof PptxGenJS === 'undefined') {
            console.error('PptxGenJS not loaded');
            throw new Error('Library missing');
        }
    }

    /**
     * Helper to convert URL to Base64
     */
    async imageUrlToBase64(url) {
        try {
            const response = await fetch(url);
            const blob = await response.blob();
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result); // This includes data:image/png;base64,...
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            });
        } catch (error) {
            console.error('Error loading image for PPT:', url, error);
            return null;
        }
    }

    /**
     * Export all sections as a full presentation with Premium Dark Design
     * @param {string} title - Vertical Name
     * @param {Array} sections - Array of section objects
     * @param {Object} metadata - Vertical metadata (hero, intro)
     */
    async exportFullPresentation(title, sections, metadata = {}) {
        if (!sections || sections.length === 0) {
            alert('No hay contenido para exportar.');
            return;
        }

        const pptx = new PptxGenJS();
        pptx.layout = 'LAYOUT_16x9';

        // Define Theme Colors
        const COLOR_BG = '000000';
        const COLOR_ACCENT = '0099FF';

        // Assets - Pre-fetch to Base64 to ensure embedding works
        const getAssetUrl = (path) => `${window.location.origin}/${path}`;

        const logoUrl = getAssetUrl('assets/2N/2N_Logo_RGB_White.png');
        const mapUrl = getAssetUrl('assets/gold-presence-map.png');

        // Parallel Fetch
        const [logoBase64, mapBase64, heroBase64] = await Promise.all([
            this.imageUrlToBase64(logoUrl),
            this.imageUrlToBase64(mapUrl),
            metadata.heroImage ? this.imageUrlToBase64(metadata.heroImage) : Promise.resolve(null)
        ]);

        // --- 1. MASTER SLIDE ---
        const masterOpts = {
            title: 'MASTER_DARK',
            background: { color: COLOR_BG },
            objects: [
                { rect: { x: 0, y: 0, w: '100%', h: 0.08, fill: COLOR_ACCENT } },
                { text: { text: '2N Telecommunications · Parte de Axis Communications', options: { x: 0.5, y: '96%', fontSize: 9, color: '666666' } } },
                { text: { text: title.toUpperCase(), options: { x: 0.5, y: 0.3, fontSize: 12, color: COLOR_ACCENT, bold: true, charSpacing: 2 } } }
            ]
        };

        // Add Logo to Master if loaded
        if (logoBase64) {
            masterOpts.objects.push({ image: { data: logoBase64, x: '88%', y: '91%', w: 1.2, h: 0.5, sizing: { type: 'contain' } } });
        }

        pptx.defineSlideMaster(masterOpts);

        // --- 2. COVER SLIDE ---
        const coverSlide = pptx.addSlide();
        coverSlide.masterName = 'MASTER_DARK';
        coverSlide.background = { color: COLOR_BG };

        // Background Image if available (Hero)
        if (heroBase64) {
            coverSlide.addImage({ data: heroBase64, x: 0, y: 0, w: '100%', h: '100%', sizing: { type: 'cover' } });
            coverSlide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: '100%', h: '100%', fill: '000000', transparency: 40 });
        }

        // Giant Background Logo
        if (logoBase64) {
            coverSlide.addImage({ data: logoBase64, x: 3, y: 2.5, w: 7, h: 2, sizing: { type: 'contain' }, transparency: 85 });
        }

        // Title
        coverSlide.addText((metadata.heroTitle || title).toUpperCase(), {
            x: 0.5, y: 2.8, w: '90%',
            fontSize: 40, color: 'FFFFFF', bold: true, align: 'center', fontFace: 'Arial Black'
        });

        coverSlide.addText('ESPECIFICACIÓN DE SOLUCIÓN', {
            x: 0.5, y: 4.2, w: '90%',
            fontSize: 14, color: COLOR_ACCENT, align: 'center', charSpacing: 4
        });

        // --- 3. COMPANY INTRO SLIDE (Map Background) ---
        const companySlide = pptx.addSlide();
        companySlide.masterName = 'MASTER_DARK';
        companySlide.background = { color: COLOR_BG };

        // Map Background
        if (mapBase64) {
            companySlide.addImage({ data: mapBase64, x: 0, y: 0, w: '100%', h: '100%', sizing: { type: 'cover' } });
            // Very Light Overlay (only 10% opacity / 90% transparency)
            companySlide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: '100%', h: '100%', fill: '000000', transparency: 70 });
        } else {
            // Fallback text if map fails
            companySlide.addText('(Map Loading Failed)', { x: 0, y: 0, fontSize: 8, color: '333333' });
        }

        // Title
        companySlide.addText('SOBRE 2N', { x: 0.5, y: 0.5, fontSize: 24, color: COLOR_ACCENT, bold: true, fontFace: 'Arial Black' });

        // Content Layout
        // Left Column: Main Text
        companySlide.addText(
            '2N es el líder mundial en sistemas de control de acceso e intercomunicadores IP. Desde 1991, hemos liderado la innovación en el sector.\n\n' +
            'Nuestros productos se encuentran en los edificios más emblemáticos del mundo, ofreciendo seguridad, diseño y comodidad sin compromisos.',
            { x: 0.5, y: 1.5, w: 6, h: 4, fontSize: 16, color: 'FFFFFF', align: 'left', lineSpacing: 28, bold: true, shadow: { type: 'outer', color: '000000', blur: 5, offset: 2, opacity: 0.8 } }
        );

        // Right Column: Key Stats
        companySlide.addShape(pptx.ShapeType.line, { x: 7, y: 1.5, w: 0, h: 4, line: { color: COLOR_ACCENT, width: 2 } });

        companySlide.addText('DATOS CLAVE', { x: 7.2, y: 1.3, fontSize: 14, color: COLOR_ACCENT, bold: true });

        companySlide.addText(
            '• Fundada en 1991 en Praga\n\n' +
            '• Parte de Axis Communications\n\n' +
            '• +14% Inversión anual en I+D\n\n' +
            '• Presencia Global en +100 países\n\n' +
            '• Creadores del primer IP Intercom',
            { x: 7.2, y: 1.8, w: 5, fontSize: 14, color: 'FFFFFF', lineSpacing: 24, bold: true, shadow: { type: 'outer', color: '000000', blur: 5, offset: 2, opacity: 0.8 } }
        );


        // --- 4. SOLUTION INTRO SLIDE ---
        if (metadata.introTitle || metadata.introText) {
            const introSlide = pptx.addSlide();
            introSlide.masterName = 'MASTER_DARK';
            introSlide.background = { color: COLOR_BG };

            // Title
            introSlide.addText((metadata.introTitle || 'Visión de la Solución').toUpperCase(), {
                x: 0.5, y: 0.8, w: '90%', fontSize: 24, color: COLOR_ACCENT, bold: true, fontFace: 'Arial Black'
            });

            // Text Content
            const introText = metadata.introText ? metadata.introText.replace(/<[^>]*>/g, '') : '';
            introSlide.addText(introText, {
                x: 0.5, y: 1.5, w: 12, h: 4,
                fontSize: 16, color: 'EEEEEE', align: 'left', lineSpacing: 28
            });

            // Benefits (Bottom)
            if (metadata.benefits && metadata.benefits.length > 0) {
                let xPos = 0.5;
                metadata.benefits.forEach((b, i) => {
                    if (i < 3) {
                        introSlide.addText(b, {
                            x: xPos, y: 5.0, w: 4, h: 1.5,
                            fontSize: 12, color: 'FFFFFF', align: 'center', valign: 'middle',
                            fill: { color: '111111' }, line: { color: '333333' }
                        });
                        introSlide.addShape(pptx.ShapeType.line, { x: xPos, y: 5.0, w: 4, h: 0, line: { color: COLOR_ACCENT, width: 3 } });

                        xPos += 4.2;
                    }
                });
            }
        }

        // --- 5. CONTENT SLIDES (With Pre-fetch) ---
        // For section images, we could also pre-fetch, but for now rely on path if CORS allows.
        // Actually, to be safe, let's pre-fetch section images too if we want to be bulletproof.
        // But that might take too long. Let's start with critical assets.

        sections.forEach((section, index) => {
            this.createSectionSlide(pptx, section, index);
        });

        // Save
        const safeTitle = title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        const filename = `2N_Solucion_${safeTitle}_Premium_Final_v4.pptx`;
        await pptx.writeFile({ fileName: filename });
    }

    /**
     * Section Slide Logic
     */
    createSectionSlide(pptx, section, index) {
        const slide = pptx.addSlide();
        slide.masterName = 'MASTER_DARK';
        slide.background = { color: '000000' };

        if (section.title) {
            slide.addText(section.title.toUpperCase(), {
                x: 0.5, y: 0.5, w: '90%',
                fontSize: 20, color: 'FFFFFF', bold: true, fontFace: 'Arial Black'
            });
            slide.addShape(pptx.ShapeType.line, { x: 0.5, y: 0.9, w: 10, h: 0, line: { color: '333333', width: 1 } });
        }

        let imgX = 0.5, imgY = 1.2, imgW = 6, imgH = 4.2;
        let txtX = 6.8, txtY = 1.2, txtW = 6.0;

        if (section.layout === 'right') {
            txtX = 0.5;
            imgX = 6.8;
        }

        if (section.imageUrl) {
            slide.addShape(pptx.ShapeType.rect, { x: imgX - 0.02, y: imgY - 0.02, w: imgW + 0.04, h: imgH + 0.04, fill: 'FFFFFF' });

            if (section.imageUrl.match(/\.(mp4|webm)$/i)) {
                slide.addText("VIDEO DISPONIBLE EN WEB", { x: imgX, y: imgY, w: imgW, h: imgH, fill: '111111', align: 'center', color: '666666', fontSize: 10 });
            } else {
                // If this fails, next step is to pre-fetch these too.
                slide.addImage({ path: section.imageUrl, x: imgX, y: imgY, w: imgW, h: imgH, sizing: { type: 'contain', w: imgW, h: imgH } });
            }
        }

        const cleanText = section.text ? section.text.replace(/<[^>]*>/g, '') : '';
        slide.addText(cleanText, {
            x: txtX, y: txtY, w: txtW, h: 4.2,
            fontSize: 12, color: 'CCCCCC', valign: 'top', lineSpacing: 20
        });
    }

    // Legacy method
    async exportSection(section) {
        await this.exportFullPresentation(section.title || 'Slide', [section], {});
    }
}

export const pptService = new PptService();
