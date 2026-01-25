
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
                reader.onloadend = () => resolve(reader.result);
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            });
        } catch (error) {
            console.error('Error loading image for PPT:', url, error);
            // Return null so we can handle fallback (e.g. plain color)
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
        const COLOR_BG = '000000'; // Fallback
        const COLOR_ACCENT = '0099FF';

        // Assets
        const getAssetUrl = (path) => `${window.location.origin}/${path}`;

        const logoUrl = getAssetUrl('assets/2N/2N_Logo_RGB_White.png');
        const mapUrl = getAssetUrl('assets/gold-presence-map.png');
        const bgUrl = getAssetUrl('assets/abstract_bg.png'); // New Disruptive BG

        // Parallel Fetch
        const [logoBase64, mapBase64, bgBase64, heroBase64] = await Promise.all([
            this.imageUrlToBase64(logoUrl),
            this.imageUrlToBase64(mapUrl),
            this.imageUrlToBase64(bgUrl),
            metadata.heroImage ? this.imageUrlToBase64(metadata.heroImage) : Promise.resolve(null)
        ]);

        // --- 1. MASTER SLIDE (With Abstract BG) ---
        const masterOpts = {
            title: 'MASTER_DARK',
            background: { color: COLOR_BG },
            objects: []
        };

        // Add Abstract BG if available
        if (bgBase64) {
            masterOpts.objects.push({ image: { data: bgBase64, x: 0, y: 0, w: '100%', h: '100%', sizing: { type: 'cover' } } });
            // Darken it slightly so text pops
            masterOpts.objects.push({ rect: { x: 0, y: 0, w: '100%', h: '100%', fill: '000000', transparency: 20 } });
        }

        // Add Standard Elements on top
        masterOpts.objects.push({ rect: { x: 0, y: 0, w: '100%', h: 0.08, fill: COLOR_ACCENT } });
        masterOpts.objects.push({ text: { text: '2N Telecommunications · Parte de Axis Communications', options: { x: 0.5, y: '96%', fontSize: 9, color: 'AAAAAA' } } });
        masterOpts.objects.push({ text: { text: title.toUpperCase(), options: { x: 0.5, y: 0.3, fontSize: 12, color: COLOR_ACCENT, bold: true, charSpacing: 2 } } });

        if (logoBase64) {
            masterOpts.objects.push({ image: { data: logoBase64, x: '88%', y: '91%', w: 1.2, h: 0.5, sizing: { type: 'contain' } } });
        }

        pptx.defineSlideMaster(masterOpts);

        // --- 2. COVER SLIDE ---
        const coverSlide = pptx.addSlide();
        coverSlide.masterName = 'MASTER_DARK';
        // Cover gets Hero Image if available, otherwise falls back to Master BG
        if (heroBase64) {
            // We need to explicitly clear background or overlay?
            // Since Master BG is in objects, it might be behind. Ideally we cover it.
            coverSlide.addImage({ data: heroBase64, x: 0, y: 0, w: '100%', h: '100%', sizing: { type: 'cover' } });
            coverSlide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: '100%', h: '100%', fill: '000000', transparency: 40 });
        } else if (bgBase64) {
            // If no hero image, use Abstract BG (already in master, but maybe we want specific cover variation)
            // Let's just trust master.
        }

        // Giant Background Logo
        if (logoBase64) {
            coverSlide.addImage({ data: logoBase64, x: 3, y: 2.5, w: 7, h: 2, sizing: { type: 'contain' }, transparency: 85 });
        }

        // Title
        coverSlide.addText((metadata.heroTitle || title).toUpperCase(), {
            x: 0.5, y: 2.8, w: '90%',
            fontSize: 40, color: 'FFFFFF', bold: true, align: 'center', fontFace: 'Arial Black', shadow: { type: 'outer', color: '000000', blur: 10, offset: 2 }
        });

        coverSlide.addText('ESPECIFICACIÓN DE SOLUCIÓN', {
            x: 0.5, y: 4.2, w: '90%',
            fontSize: 14, color: COLOR_ACCENT, align: 'center', charSpacing: 4
        });

        // --- 3. COMPANY INTRO SLIDE (Map Background) ---
        const companySlide = pptx.addSlide();
        companySlide.masterName = 'MASTER_DARK';

        // This slide needs the MAP, blocking the Abstract BG of Master?
        // Yes, put image on top at z=0 relative to slide content (on top of master objects?)
        // PptxGenJS order: Master Objects -> Slide Objects.
        // So adding image here will cover master BG.
        if (mapBase64) {
            companySlide.addImage({ data: mapBase64, x: 0, y: 0, w: '100%', h: '100%', sizing: { type: 'cover' } });
            // Overlay adjustments (ensure visible but text readable)
            companySlide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: '100%', h: '100%', fill: '000000', transparency: 60 });
        } else {
            companySlide.addText('(Map Loading Failed)', { x: 0, y: 0, fontSize: 8, color: 'red' });
        }

        // Title
        companySlide.addText('SOBRE 2N', { x: 0.5, y: 0.5, fontSize: 24, color: COLOR_ACCENT, bold: true, fontFace: 'Arial Black' });

        // Content
        companySlide.addText(
            '2N es el líder mundial en sistemas de control de acceso e intercomunicadores IP. Desde 1991, hemos liderado la innovación en el sector.\n\n' +
            'Nuestros productos se encuentran en los edificios más emblemáticos del mundo, ofreciendo seguridad, diseño y comodidad sin compromisos.',
            { x: 0.5, y: 1.5, w: 6, h: 4, fontSize: 16, color: 'FFFFFF', align: 'left', lineSpacing: 28, bold: true, shadow: { type: 'outer', color: '000000', blur: 5, offset: 2, opacity: 0.8 } }
        );

        // Stats
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
        // Uses Master BG (Abstract)
        if (metadata.introTitle || metadata.introText) {
            const introSlide = pptx.addSlide();
            introSlide.masterName = 'MASTER_DARK';

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

            // Benefits
            if (metadata.benefits && metadata.benefits.length > 0) {
                let xPos = 0.5;
                metadata.benefits.forEach((b, i) => {
                    if (i < 3) {
                        introSlide.addText(b, {
                            x: xPos, y: 5.0, w: 4, h: 1.5,
                            fontSize: 12, color: 'FFFFFF', align: 'center', valign: 'middle',
                            fill: { color: '111111', transparency: 30 }, line: { color: '333333' }
                        });
                        introSlide.addShape(pptx.ShapeType.line, { x: xPos, y: 5.0, w: 4, h: 0, line: { color: COLOR_ACCENT, width: 3 } });
                        xPos += 4.2;
                    }
                });
            }
        }

        // --- 5. CONTENT SLIDES ---
        // Uses Master BG (Abstract)
        sections.forEach((section, index) => {
            this.createSectionSlide(pptx, section, index);
        });

        // Save
        const safeTitle = title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        const filename = `2N_Solucion_${safeTitle}_Disruptive_v1.pptx`;
        await pptx.writeFile({ fileName: filename });
    }

    /**
     * Section Slide Logic
     */
    createSectionSlide(pptx, section, index) {
        const slide = pptx.addSlide();
        slide.masterName = 'MASTER_DARK';

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
            // Removed white border, used subtle glow/shadow instead for disruptive look
            slide.addShape(pptx.ShapeType.rect, { x: imgX - 0.02, y: imgY - 0.02, w: imgW + 0.04, h: imgH + 0.04, fill: '111111', line: { color: '333333' } }); // Dark Frame

            if (section.imageUrl.match(/\.(mp4|webm)$/i)) {
                slide.addText("VIDEO DISPONIBLE EN WEB", { x: imgX, y: imgY, w: imgW, h: imgH, fill: '111111', align: 'center', color: '666666', fontSize: 10 });
            } else {
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
