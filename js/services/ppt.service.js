
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

    async imageUrlToBase64(url) {
        try {
            console.log(`Fetching image: ${url}`);
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

    async exportFullPresentation(title, sections, metadata = {}) {
        if (!sections || sections.length === 0) {
            alert('No hay contenido para exportar.');
            return;
        }

        const pptx = new PptxGenJS();
        pptx.layout = 'LAYOUT_16x9';

        const COLOR_ACCENT = '0099FF';

        const getAssetUrl = (path) => `${window.location.origin}/${path}`;

        // Load Static Slide Images with detailed error logging
        const loadImgSafe = async (url) => {
            try {
                const base64 = await this.imageUrlToBase64(url);
                if (!base64) console.warn('PPT: Image loaded but returned empty base64:', url);
                return base64;
            } catch (e) {
                console.error('PPT: Failed to load image:', url, e);
                return null;
            }
        };

        // Load Static Slide Images (Using Direct Firebase URLs)
        const coverUrl = 'https://firebasestorage.googleapis.com/v0/b/nsoluciones-68554.firebasestorage.app/o/multimedia%2F2N%2F1769375753951_Portada.png?alt=media&token=2566ea37-c62e-4a62-a078-445ee34504c8';
        const innovationUrl = 'https://firebasestorage.googleapis.com/v0/b/nsoluciones-68554.firebasestorage.app/o/multimedia%2F2N%2F1769375754501_sobre_2n.png?alt=media&token=1b45b35a-1adf-4faa-bb2a-b64ea02d1a0e';
        const historyUrl = 'https://firebasestorage.googleapis.com/v0/b/nsoluciones-68554.firebasestorage.app/o/multimedia%2F2N%2F1769375752617_mapa_2n.png?alt=media&token=4b991682-1e43-4736-bf7e-e239cbe84d66';
        const why2nUrl = 'https://firebasestorage.googleapis.com/v0/b/nsoluciones-68554.firebasestorage.app/o/multimedia%2F2N%2F1769375753424_porque_2n.png?alt=media&token=34739ddd-45c7-49a4-ba5a-6b204d3e6f92';

        const [coverBg, innovationBg, historyBg, why2nBg] = await Promise.all([
            loadImgSafe(coverUrl),
            loadImgSafe(innovationUrl),
            loadImgSafe(historyUrl),
            loadImgSafe(why2nUrl)
        ]);

        // --- 1. SLIDE 1: PORTADA (Custom Image + Vertical Name Overlay) ---
        const coverSlide = pptx.addSlide();
        coverSlide.background = { color: '000000' };

        if (coverBg) {
            coverSlide.addImage({ data: coverBg, x: 0, y: 0, w: '100%', h: '100%', sizing: { type: 'cover' } });
        }

        // Vertical Name Overlay (Centered, Clean)
        // User request: "quiero que lo pongas el titulo completo por ejemplo, soluciones BTS"

        // precise mapping based on known IDs
        const mapTitle = (t) => {
            const lower = t.toLowerCase();
            if (lower.includes('bts')) return 'SOLUCIONES RESIDENCIAL BTS';
            if (lower.includes('btr')) return 'SOLUCIONES RESIDENCIAL BTR';
            if (lower.includes('office') || lower.includes('oficina')) return 'SOLUCIONES OFICINAS';
            if (lower.includes('hotel')) return 'SOLUCIONES HOTELES';
            if (lower.includes('retail')) return 'SOLUCIONES RETAIL';
            if (lower.includes('security') || lower.includes('seguridad')) return 'SOLUCIONES SEGURIDAD';

            // Fallback
            return t.toUpperCase().startsWith('SOLUCIONES') ? t.toUpperCase() : `SOLUCIONES ${t.toUpperCase()}`;
        };

        const displayTitle = mapTitle(title);

        coverSlide.addText(displayTitle, {
            x: 0.5, y: 4.5, w: 9, h: 1,
            fontSize: 36, color: '0099FF', bold: true, align: 'left', fontFace: 'Arial Black'
        });


        // --- 2. SLIDE 2: INNOVACIÓN (Static Image) ---
        // "la segunda y tercera van siempre fijas"
        const slide2 = pptx.addSlide();
        slide2.background = { color: '000000' };
        if (innovationBg) {
            slide2.addImage({ data: innovationBg, x: 0, y: 0, w: '100%', h: '100%', sizing: { type: 'contain' } });
        }

        // --- 3. SLIDE 3: HISTORIA (Static Image) ---
        const slide3 = pptx.addSlide();
        slide3.background = { color: '000000' };
        if (historyBg) {
            slide3.addImage({ data: historyBg, x: 0, y: 0, w: '100%', h: '100%', sizing: { type: 'contain' } });
        }


        // --- 4. DYNAMIC SECTIONS (Middle) ---
        // "las que van en el medio son las secciones de cada vertical"

        // 4.1 Introduction (Text Only)
        if (metadata.introTitle || metadata.introText) {
            const introSlide = pptx.addSlide();
            introSlide.background = { color: '000000' };
            // Simple Header
            introSlide.addText((metadata.introTitle || 'Visión').toUpperCase(), { x: 0.5, y: 0.5, w: '90%', fontSize: 24, color: '0099FF', bold: true });
            introSlide.addShape('line', { x: 0.5, y: 1.0, w: 9, h: 0, line: { color: '333333', width: 1 } });

            introSlide.addText(metadata.introText ? metadata.introText.replace(/<[^>]*>/g, '') : '', { x: 0.5, y: 1.5, w: 9, h: 4, fontSize: 16, color: 'EEEEEE', valign: 'top' });
        }

        // 4.2 Product Sections
        sections.forEach((section, index) => {
            this.createSectionSlide(pptx, section, index);
        });


        // --- 5. FINAL SLIDE: POR QUÉ 2N (Static Image) ---
        // "la ultima es la que tienes que poner en la ultima"
        const finalSlide = pptx.addSlide();
        finalSlide.background = { color: '000000' };
        if (why2nBg) {
            finalSlide.addImage({ data: why2nBg, x: 0, y: 0, w: '100%', h: '100%', sizing: { type: 'contain' } });
        }

        const safeTitle = title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        const filename = `2N_Solucion_${safeTitle}_v16_Hybrid.pptx`;
        await pptx.writeFile({ fileName: filename });
    }

    createSectionSlide(pptx, section, index) {
        // Standard Template for Dynamic Content
        const slide = pptx.addSlide();
        slide.background = { color: '000000' };

        // Title
        if (section.title) {
            slide.addText(section.title.toUpperCase(), {
                x: 0.5, y: 0.5, w: '90%',
                fontSize: 20, color: 'FFFFFF', bold: true, fontFace: 'Arial Black'
            });
            slide.addShape('line', { x: 0.5, y: 0.9, w: 9, h: 0, line: { color: '333333', width: 1 } });
        }

        let imgX = 0.5, imgY = 1.2, imgW = 5.5, imgH = 4.0;
        let txtX = 6.2, txtY = 1.2, txtW = 3.3;

        // Image Frame (Dark background behind image)
        slide.addShape(pptx.ShapeType.rect, {
            x: imgX - 0.05, y: imgY - 0.05, w: imgW + 0.1, h: imgH + 0.1,
            fill: { color: '111111' }, line: { color: '333333' }
        });

        if (section.imageUrl) {
            if (section.imageUrl.match(/\.(mp4|webm)$/i)) {
                slide.addText("VIDEO (WEB)", { x: imgX, y: imgY, w: imgW, h: imgH, fill: '000000', align: 'center', color: '666666' });
            } else {
                slide.addImage({ path: section.imageUrl, x: imgX, y: imgY, w: imgW, h: imgH, sizing: { type: 'contain' } });
            }
        }

        const cleanText = section.text ? section.text.replace(/<[^>]*>/g, '') : '';
        slide.addText(cleanText, { x: txtX, y: txtY, w: txtW, h: 4.2, fontSize: 12, color: 'CCCCCC', valign: 'top', lineSpacing: 18 });
    }

    async exportSection(section) {
        await this.exportFullPresentation(section.title || 'Slide', [section], {});
    }
}

export const pptService = new PptService();
