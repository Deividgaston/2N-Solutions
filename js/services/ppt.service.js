
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

        // --- 1. MASTER SLIDE (Dark Theme) ---
        pptx.defineSlideMaster({
            title: 'MASTER_DARK',
            background: { color: '000000' }, // Black Background
            objects: [
                // Top Accent Line (Cyan/Blue)
                { rect: { x: 0, y: 0, w: '100%', h: 0.05, fill: '0099FF' } },
                // Footer Branding
                { text: { text: '2N Telecommunications', options: { x: 0.5, y: '95%', fontSize: 9, color: '666666' } } },
                { text: { text: title.toUpperCase(), options: { x: 0.5, y: 0.3, fontSize: 10, color: '0099FF', bold: true, charSpacing: 2 } } }
            ]
        });

        // --- 2. COVER SLIDE ---
        const coverSlide = pptx.addSlide();
        coverSlide.masterName = 'MASTER_DARK';
        coverSlide.background = { color: '000000' };

        // Background Image if available (Hero)
        if (metadata.heroImage) {
            // Full screen background image with overlay
            coverSlide.addImage({ path: metadata.heroImage, x: 0, y: 0, w: '100%', h: '100%' });
            // Dark Overlay
            coverSlide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: '100%', h: '100%', fill: '000000', transparency: 60 });
        }

        // Title
        coverSlide.addText((metadata.heroTitle || title).toUpperCase(), {
            x: 0.5, y: 2.5, w: '90%',
            fontSize: 44, color: 'FFFFFF', bold: true, align: 'center', fontFace: 'Arial Black'
        });

        coverSlide.addText('ESPECIFICACIÓN DE SOLUCIÓN', {
            x: 0.5, y: 3.8, w: '90%',
            fontSize: 16, color: '0099FF', align: 'center', charSpacing: 3
        });

        // --- 3. INTRO SLIDE (Company Description) ---
        if (metadata.introTitle || metadata.introText) {
            const introSlide = pptx.addSlide();
            introSlide.masterName = 'MASTER_DARK';
            introSlide.background = { color: '000000' };

            // Title
            introSlide.addText((metadata.introTitle || 'Sobre la Solución').toUpperCase(), {
                x: 0.5, y: 0.8, w: '90%', fontSize: 24, color: '0099FF', bold: true, fontFace: 'Arial Black'
            });

            // Text Content
            const introText = metadata.introText ? metadata.introText.replace(/<[^>]*>/g, '') : '';
            introSlide.addText(introText, {
                x: 0.5, y: 1.5, w: 9, h: 4,
                fontSize: 16, color: 'EEEEEE', align: 'left', lineSpacing: 28
            });

            // Benefits (if any)
            if (metadata.benefits && metadata.benefits.length > 0) {
                let yPos = 4.5;
                metadata.benefits.forEach(b => {
                    introSlide.addText('• ' + b, { x: 0.8, y: yPos, w: 8, fontSize: 14, color: 'CCCCCC' });
                    yPos += 0.4;
                });
            }
        }

        // --- 4. CONTENT SLIDES ---
        for (const section of sections) {
            this.createSectionSlide(pptx, section);
        }

        // Save
        const filename = `2N_Solucion_${title.replace(/\s+/g, '_')}_Black.pptx`;
        await pptx.writeFile({ fileName: filename });
    }

    /**
     * Helper to add a single slide for a section (Dark Mode)
     */
    createSectionSlide(pptx, section) {
        const slide = pptx.addSlide();
        slide.masterName = 'MASTER_DARK';
        slide.background = { color: '000000' };

        // Title
        if (section.title) {
            slide.addText(section.title.toUpperCase(), {
                x: 0.5, y: 0.6, w: '90%',
                fontSize: 22, color: 'FFFFFF', bold: true, fontFace: 'Arial Black'
            });
        }

        // Layout Logic
        // Default: Image Left, Text Right
        let imgX = 0.5, imgY = 1.3, imgW = 4.8, imgH = 3.2;
        let txtX = 5.5, txtY = 1.3, txtW = 4.0;

        // If layout is 'right' (Text Left, Image Right)
        if (section.layout === 'right') {
            txtX = 0.5;
            imgX = 5.0;
        }

        // Add Image (with Glow/Border effect simulated)
        if (section.imageUrl) {
            // White Border around image
            slide.addShape(pptx.ShapeType.rect, { x: imgX - 0.03, y: imgY - 0.03, w: imgW + 0.06, h: imgH + 0.06, fill: 'FFFFFF' });

            if (section.imageUrl.match(/\.(mp4|webm)$/i)) {
                slide.addText("VIDEO DISPONIBLE EN WEB", { x: imgX, y: imgY, w: imgW, h: imgH, fill: '111111', align: 'center', color: '666666', fontSize: 10 });
            } else {
                slide.addImage({ path: section.imageUrl, x: imgX, y: imgY, w: imgW, h: imgH });
            }
        }

        // Add Text
        const cleanText = section.text ? section.text.replace(/<[^>]*>/g, '') : '';
        slide.addText(cleanText, {
            x: txtX, y: txtY, w: txtW, h: 4,
            fontSize: 14, color: 'CCCCCC', valign: 'top', lineSpacing: 24
        });
    }

    // Legacy method
    async exportSection(section) {
        await this.exportFullPresentation(section.title || 'Slide', [section], {});
    }
}

export const pptService = new PptService();
