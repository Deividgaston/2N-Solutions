
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
        const COLOR_TEXT = 'FFFFFF';
        const COLOR_TEXT_MUTED = 'AAAAAA';

        // --- 1. MASTER SLIDE (Dark Theme) ---
        pptx.defineSlideMaster({
            title: 'MASTER_DARK',
            background: { color: COLOR_BG },
            objects: [
                // Top Accent Line
                { rect: { x: 0, y: 0, w: '100%', h: 0.08, fill: COLOR_ACCENT } },
                // Footer Branding
                { text: { text: '2N Telecommunications', options: { x: 0.5, y: '96%', fontSize: 9, color: '666666' } } },
                { text: { text: title.toUpperCase(), options: { x: 0.5, y: 0.3, fontSize: 12, color: COLOR_ACCENT, bold: true, charSpacing: 2 } } },
                // Corner Logo Placeholder (Text for now)
                { text: { text: '2N', options: { x: '92%', y: '92%', fontSize: 18, color: 'FFFFFF', bold: true, fontFace: 'Arial Black' } } }
            ]
        });

        // --- 2. COVER SLIDE ---
        const coverSlide = pptx.addSlide();
        coverSlide.masterName = 'MASTER_DARK';
        coverSlide.background = { color: COLOR_BG };

        // Background Image if available (Hero)
        if (metadata.heroImage) {
            // Full screen background image
            coverSlide.addImage({ path: metadata.heroImage, x: 0, y: 0, w: '100%', h: '100%' });
            // Dark Overlay Gradient (Simulated with transparency)
            coverSlide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: '100%', h: '100%', fill: '000000', transparency: 40 });
        }

        // Large 2N Logo Area (Centered)
        coverSlide.addText('2N', {
            x: 0, y: 1.5, w: '100%',
            fontSize: 80, color: 'FFFFFF', bold: true, align: 'center', fontFace: 'Arial Black'
        });

        // Title
        coverSlide.addText((metadata.heroTitle || title).toUpperCase(), {
            x: 0.5, y: 2.8, w: '90%',
            fontSize: 36, color: 'FFFFFF', bold: true, align: 'center', fontFace: 'Arial'
        });

        coverSlide.addText('ESPECIFICACIÓN DE SOLUCIÓN', {
            x: 0.5, y: 4.0, w: '90%',
            fontSize: 14, color: COLOR_ACCENT, align: 'center', charSpacing: 4
        });

        // --- 3. INTRO SLIDE (Company Description) ---
        if (metadata.introTitle || metadata.introText) {
            const introSlide = pptx.addSlide();
            introSlide.masterName = 'MASTER_DARK';
            introSlide.background = { color: COLOR_BG };

            // Title
            introSlide.addText((metadata.introTitle || 'Sobre la Solución').toUpperCase(), {
                x: 0.5, y: 0.8, w: '90%', fontSize: 24, color: COLOR_ACCENT, bold: true, fontFace: 'Arial Black'
            });

            // Split Layout: Text + Benefits
            const introText = metadata.introText ? metadata.introText.replace(/<[^>]*>/g, '') : '';
            introSlide.addText(introText, {
                x: 0.5, y: 1.5, w: 6, h: 4,
                fontSize: 14, color: 'EEEEEE', align: 'left', lineSpacing: 24, valign: 'top'
            });

            // Benefits Side Panel
            if (metadata.benefits && metadata.benefits.length > 0) {
                // Background for benefits
                introSlide.addShape(pptx.ShapeType.rect, { x: 7, y: 1.5, w: 5.5, h: 4.5, fill: '111111', line: { color: '333333', width: 1 } });
                introSlide.addText('BENEFICIOS CLAVE', { x: 7.2, y: 1.8, fontSize: 12, color: COLOR_ACCENT, bold: true });

                let yPos = 2.2;
                metadata.benefits.forEach(b => {
                    introSlide.addText('• ' + b, { x: 7.2, y: yPos, w: 5, fontSize: 11, color: 'CCCCCC' });
                    yPos += 0.4;
                });
            }
        }

        // --- 4. CONTENT SLIDES ---
        sections.forEach((section, index) => {
            this.createSectionSlide(pptx, section, index);
        });

        // Save
        const safeTitle = title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        const filename = `2N_Solucion_${safeTitle}_Premium.pptx`;
        await pptx.writeFile({ fileName: filename });
    }

    /**
     * Helper to add a single slide for a section (Dark Mode)
     */
    createSectionSlide(pptx, section, index) {
        const slide = pptx.addSlide();
        slide.masterName = 'MASTER_DARK';
        slide.background = { color: '000000' };

        // Title Bar
        if (section.title) {
            slide.addText(section.title.toUpperCase(), {
                x: 0.5, y: 0.5, w: '90%',
                fontSize: 20, color: 'FFFFFF', bold: true, fontFace: 'Arial Black'
            });
            // Underline
            slide.addShape(pptx.ShapeType.line, { x: 0.5, y: 0.9, w: 10, h: 0, line: { color: '333333', width: 1 } });
        }

        // Layout Logic
        // Default: Image Left (Big), Text Right (Compact)
        let imgX = 0.5, imgY = 1.2, imgW = 6, imgH = 4.2;
        let txtX = 6.8, txtY = 1.2, txtW = 6.0;

        // If layout is 'right' (Text Left, Image Right)
        if (section.layout === 'right') {
            txtX = 0.5;
            imgX = 6.8;
            imgW = 6;
        }

        // Image Container
        if (section.imageUrl) {
            // White Border around image
            slide.addShape(pptx.ShapeType.rect, { x: imgX - 0.02, y: imgY - 0.02, w: imgW + 0.04, h: imgH + 0.04, fill: 'FFFFFF' });

            if (section.imageUrl.match(/\.(mp4|webm)$/i)) {
                slide.addText("VIDEO DISPONIBLE EN WEB", { x: imgX, y: imgY, w: imgW, h: imgH, fill: '111111', align: 'center', color: '666666', fontSize: 10 });
            } else {
                slide.addImage({ path: section.imageUrl, x: imgX, y: imgY, w: imgW, h: imgH, sizing: { type: 'contain', w: imgW, h: imgH } });
            }
        }

        // Text Content
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
