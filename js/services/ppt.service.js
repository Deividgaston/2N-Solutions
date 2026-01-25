
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
            if (!response.ok) throw new Error(`Fetch failed: ${response.status}`);
            const blob = await response.blob();
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result);
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            });
        } catch (error) {
            console.error('Error loading image for PPT:', url, error);
            return null;
        }
    }

    /**
     * Export full presentation
     */
    async exportFullPresentation(title, sections, metadata = {}) {
        if (!sections || sections.length === 0) {
            alert('No hay contenido para exportar.');
            return;
        }

        const pptx = new PptxGenJS();
        pptx.layout = 'LAYOUT_16x9';

        // Colors
        const COLOR_ACCENT = '0099FF';

        // Assets
        const getAssetUrl = (path) => `${window.location.origin}/${path}`;

        const logoUrl = getAssetUrl('assets/2N/2N_Logo_RGB_White.png');
        const mapUrl = getAssetUrl('assets/gold-presence-map.png');
        const bgUrl = getAssetUrl('assets/abstract_bg.png');
        const innovationUrl = getAssetUrl('assets/innovation_bg.jpg'); // New Asset for About Slide

        console.log('Fetching assets...');
        const [logoBase64, mapBase64, bgBase64, innovationBase64, heroBase64] = await Promise.all([
            this.imageUrlToBase64(logoUrl),
            this.imageUrlToBase64(mapUrl),
            this.imageUrlToBase64(bgUrl),
            this.imageUrlToBase64(innovationUrl),
            metadata.heroImage ? this.imageUrlToBase64(metadata.heroImage) : Promise.resolve(null)
        ]);

        // --- 1. MASTER SLIDE ---
        const masterOpts = {
            title: 'MASTER_DARK',
            background: { color: '000000' },
            objects: []
        };

        // Layer 0: Black Safety Net
        masterOpts.objects.push({ rect: { x: 0, y: 0, w: '100%', h: '100%', fill: '000000' } });

        // Layer 1: Abstract BG
        if (bgBase64) {
            masterOpts.objects.push({ image: { data: bgBase64, x: 0, y: 0, w: '100%', h: '100%', sizing: { type: 'cover' } } });
            masterOpts.objects.push({ rect: { x: 0, y: 0, w: '100%', h: '100%', fill: '000000', transparency: 20 } });
        }

        // Layer 2: UI Chrome
        masterOpts.objects.push({ rect: { x: 0, y: 0, w: '100%', h: 0.08, fill: COLOR_ACCENT } }); // Top Bar

        // Footer Text
        masterOpts.objects.push({ text: { text: '2N Telecommunications · Parte de Axis Communications', options: { x: 0.5, y: '96%', fontSize: 9, color: 'AAAAAA' } } });
        masterOpts.objects.push({ text: { text: title.toUpperCase(), options: { x: 0.5, y: 0.3, fontSize: 12, color: COLOR_ACCENT, bold: true, charSpacing: 2 } } });

        // Footer Logo - Adjusted position to be safe
        if (logoBase64) {
            masterOpts.objects.push({ image: { data: logoBase64, x: '88%', y: '90%', w: 1.2, h: 0.6, sizing: { type: 'contain' } } });
        }

        pptx.defineSlideMaster(masterOpts);

        // --- 2. COVER SLIDE ---
        const coverSlide = pptx.addSlide();
        coverSlide.masterName = 'MASTER_DARK';
        coverSlide.background = { color: '000000' };

        // Hero Image
        if (heroBase64) {
            coverSlide.addImage({ data: heroBase64, x: 0, y: 0, w: '100%', h: '100%', sizing: { type: 'cover' } });
            coverSlide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: '100%', h: '100%', fill: '000000', transparency: 40 });
        }

        // 2N Watermark
        if (logoBase64) {
            coverSlide.addImage({ data: logoBase64, x: 3, y: 2.5, w: 7, h: 2, sizing: { type: 'contain' }, transparency: 85 });
        }

        // Titles
        coverSlide.addText((metadata.heroTitle || title).toUpperCase(), {
            x: 0.5, y: 2.8, w: '90%',
            fontSize: 40, color: 'FFFFFF', bold: true, align: 'center', fontFace: 'Arial Black', shadow: { type: 'outer', color: '000000', blur: 10, offset: 2 }
        });
        coverSlide.addText('ESPECIFICACIÓN DE SOLUCIÓN', {
            x: 0.5, y: 4.2, w: '90%',
            fontSize: 14, color: COLOR_ACCENT, align: 'center', charSpacing: 4
        });

        // --- 3. ABOUT 2N SLIDE ("Innovation") ---
        const aboutSlide = pptx.addSlide();
        aboutSlide.masterName = 'MASTER_DARK';
        aboutSlide.background = { color: '000000' };

        aboutSlide.addText('INNOVACIÓN EN NUESTRO ADN', { x: 0.5, y: 0.5, fontSize: 24, color: COLOR_ACCENT, bold: true, fontFace: 'Arial Black' });

        // Layout: Image Left, Text Right (Matching company.html roughly)
        // Image
        if (innovationBase64) {
            aboutSlide.addImage({ data: innovationBase64, x: 0.5, y: 1.5, w: 5, h: 3.5, sizing: { type: 'cover' } });
            // Add subtle border
            aboutSlide.addShape(pptx.ShapeType.rect, { x: 0.5, y: 1.5, w: 5, h: 3.5, fill: { type: 'none' }, line: { color: '333333', width: 1 } });
        }

        // Text
        aboutSlide.addText(
            '2N es el líder mundial en sistemas de control de acceso e intercomunicadores IP. Desde 1991, hemos liderado la innovación en el sector.\n\n' +
            'Como parte de Axis Communications (Grupo Canon), nuestros productos establecen los estándares de seguridad y diseño en la industria.',
            { x: 5.8, y: 1.5, w: 7, h: 3.5, fontSize: 16, color: 'EEEEEE', align: 'left', lineSpacing: 28 }
        );

        // --- 4. GLOBAL PRESENCE SLIDE (Map) ---
        const mapSlide = pptx.addSlide();
        mapSlide.masterName = 'MASTER_DARK';
        mapSlide.background = { color: '000000' };

        // Map Full Background
        if (mapBase64) {
            mapSlide.addImage({ data: mapBase64, x: 0, y: 0, w: '100%', h: '100%', sizing: { type: 'cover' } });
            // Light Overlay (30% opacity black -> 70% transparency)
            mapSlide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: '100%', h: '100%', fill: '000000', transparency: 70 });
        }

        mapSlide.addText('PRESENCIA INTERNACIONAL', { x: 0.5, y: 0.5, fontSize: 24, color: COLOR_ACCENT, bold: true, fontFace: 'Arial Black', shadow: { type: 'outer', color: '000000', blur: 5 } });

        // Stats Overlay - Integrated into Map
        mapSlide.addText('DATOS CLAVE', { x: 0.5, y: 1.5, fontSize: 18, color: 'FFFFFF', bold: true });

        mapSlide.addText(
            '• Fundada en 1991 en Praga\n' +
            '• Parte de Axis Communications\n' +
            '• +14% Inversión anual en I+D\n' +
            '• Presencia Global en +100 países\n' +
            '• Creadores del primer IP Intercom',
            { x: 0.5, y: 2.2, w: 6, fontSize: 16, color: 'FFFFFF', lineSpacing: 30, bold: true, shadow: { type: 'outer', color: '000000', blur: 10, offset: 2 } }
        );

        // --- 5. INTRO SLIDE (Vertical Intro) ---
        if (metadata.introTitle || metadata.introText) {
            const introSlide = pptx.addSlide();
            introSlide.masterName = 'MASTER_DARK';
            introSlide.background = { color: '000000' };

            introSlide.addText((metadata.introTitle || 'Visión de la Solución').toUpperCase(), {
                x: 0.5, y: 0.8, w: '90%', fontSize: 24, color: COLOR_ACCENT, bold: true, fontFace: 'Arial Black'
            });

            const introText = metadata.introText ? metadata.introText.replace(/<[^>]*>/g, '') : '';
            introSlide.addText(introText, {
                x: 0.5, y: 1.5, w: 12, h: 4,
                fontSize: 16, color: 'EEEEEE', align: 'left', lineSpacing: 28
            });

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

        // --- 6. SECTIONS ---
        sections.forEach((section, index) => {
            this.createSectionSlide(pptx, section, index);
        });

        // Save
        const safeTitle = title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        const filename = `2N_Solucion_${safeTitle}_Final_v5.pptx`;
        await pptx.writeFile({ fileName: filename });
    }

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
            slide.addShape(pptx.ShapeType.rect, { x: imgX - 0.02, y: imgY - 0.02, w: imgW + 0.04, h: imgH + 0.04, fill: '111111', line: { color: '333333' } });

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

    async exportSection(section) {
        await this.exportFullPresentation(section.title || 'Slide', [section], {});
    }
}

export const pptService = new PptService();
