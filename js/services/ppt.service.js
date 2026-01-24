
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
     * Export all sections as a full presentation
     * @param {string} title - Presentation Title (e.g. Vertical Name)
     * @param {Array} sections - Array of section objects
     */
    async exportFullPresentation(title, sections) {
        if (!sections || sections.length === 0) {
            alert('No hay contenido para exportar.');
            return;
        }

        const pptx = new PptxGenJS();
        pptx.layout = 'LAYOUT_16x9';

        // --- MASTER SLIDE (Template) ---
        pptx.defineSlideMaster({
            title: 'MASTER_SLIDE',
            background: { color: 'FFFFFF' },
            objects: [
                // Header Bar (Blue)
                { rect: { x: 0, y: 0, w: '100%', h: 0.15, fill: '0068B3' } },
                // Footer Branding
                { text: { text: '2N Telecommunications', options: { x: 0.5, y: '95%', fontSize: 10, color: '666666' } } },
                { text: { text: title, options: { x: 0.5, y: 0.3, fontSize: 14, color: '0068B3', bold: true } } }
            ]
        });

        // --- TITLE SLIDE ---
        const slide = pptx.addSlide();
        slide.masterName = 'MASTER_SLIDE';
        slide.addText(title.toUpperCase(), { x: 1, y: 2, w: '80%', fontSize: 36, color: '0068B3', bold: true, align: 'center' });
        slide.addText('Especificación de Solución', { x: 1, y: 3, w: '80%', fontSize: 18, color: '666666', align: 'center' });

        // --- CONTENT SLIDES ---
        for (const section of sections) {
            this.createSectionSlide(pptx, section);
        }

        // Save
        const filename = `2N_Solucion_${title.replace(/\s+/g, '_')}.pptx`;
        await pptx.writeFile({ fileName: filename });
    }

    /**
     * Helper to add a single slide for a section
     */
    createSectionSlide(pptx, section) {
        const slide = pptx.addSlide();
        slide.masterName = 'MASTER_SLIDE';

        // Title
        if (section.title) {
            slide.addText(section.title, { x: 0.5, y: 0.5, w: '90%', fontSize: 24, color: '000000', bold: true });
        }

        // Layout Logic (Simple Left/Right split)
        // Default: Image Left, Text Right
        let imgX = 0.5, imgY = 1.2, imgW = 4.5, imgH = 3.5;
        let txtX = 5.2, txtY = 1.2, txtW = 4.5;

        // If layout is 'right' (Text Left, Image Right)
        if (section.layout === 'right') {
            txtX = 0.5;
            imgX = 5.2;
        }

        // Add Image
        if (section.imageUrl) {
            if (section.imageUrl.match(/\.(mp4|webm)$/i)) {
                slide.addText("VIDEO DISPONIBLE EN WEB", { x: imgX, y: imgY, w: imgW, h: imgH, fill: 'EEEEEE', align: 'center', color: '666666', fontSize: 10 });
            } else {
                slide.addImage({ path: section.imageUrl, x: imgX, y: imgY, w: imgW, h: imgH });
            }
        }

        // Add Text
        // Strip HTML tags for PPT
        const cleanText = section.text ? section.text.replace(/<[^>]*>/g, '') : '';
        slide.addText(cleanText, { x: txtX, y: txtY, w: txtW, h: 4, fontSize: 14, color: '333333', valign: 'top' });
    }

    // Legacy method - directs to full export
    async exportSection(section) {
        await this.exportFullPresentation(section.title || 'Slide', [section]);
    }
}

export const pptService = new PptService();
