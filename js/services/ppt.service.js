
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

        const logoUrl = getAssetUrl('assets/2N/2N_Logo_RGB_White.png');
        const mapUrl = getAssetUrl('assets/gold-presence-map.png');
        const bgUrl = getAssetUrl('assets/abstract_bg.png');
        const innovationUrl = getAssetUrl('assets/innovation_bg.jpg');

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
            objects: [
                { rect: { x: 0, y: 0, w: '100%', h: '100%', fill: '000000' } } // Safety Black
            ]
        };

        if (bgBase64) {
            masterOpts.objects.push({ image: { data: bgBase64, x: 0, y: 0, w: '100%', h: '100%', sizing: { type: 'cover' } } });
            masterOpts.objects.push({ rect: { x: 0, y: 0, w: '100%', h: '100%', fill: '000000', transparency: 20 } });
        }

        masterOpts.objects.push({ rect: { x: 0, y: 0, w: '100%', h: 0.08, fill: COLOR_ACCENT } });
        masterOpts.objects.push({ text: { text: '2N Telecommunications', options: { x: 0.5, y: '96%', fontSize: 9, color: 'AAAAAA' } } });
        masterOpts.objects.push({ text: { text: title.toUpperCase(), options: { x: 0.5, y: 0.3, fontSize: 12, color: COLOR_ACCENT, bold: true, charSpacing: 2 } } });

        if (logoBase64) {
            masterOpts.objects.push({ image: { data: logoBase64, x: '90%', y: '92%', w: 1, h: 0.4, sizing: { type: 'contain' } } });
        }

        pptx.defineSlideMaster(masterOpts);

        // --- 2. COVER SLIDE ---
        const coverSlide = pptx.addSlide();
        coverSlide.masterName = 'MASTER_DARK';
        coverSlide.background = { color: '000000' };

        if (heroBase64) {
            coverSlide.addImage({ data: heroBase64, x: 0, y: 0, w: '100%', h: '100%', sizing: { type: 'cover' } });
            coverSlide.addShape('rect', { x: 0, y: 0, w: '100%', h: '100%', fill: '000000', transparency: 40 });
        }

        // Giant Logo (Proportional)
        if (logoBase64) {
            coverSlide.addImage({ data: logoBase64, x: 3.5, y: 2, w: 6.3, h: 2, sizing: { type: 'contain' } });
        }

        coverSlide.addText((metadata.heroTitle || title).toUpperCase(), {
            x: 0.5, y: 4.5, w: '90%',
            fontSize: 32, color: 'FFFFFF', bold: true, align: 'center', fontFace: 'Arial Black', shadow: { type: 'outer', color: '000000', blur: 10 }
        });

        // --- 3. INNOVATION SLIDE ---
        const aboutSlide = pptx.addSlide();
        aboutSlide.masterName = 'MASTER_DARK';
        aboutSlide.background = { color: '000000' };

        aboutSlide.addText('INNOVACIÓN EN NUESTRO ADN', { x: 0.5, y: 0.5, fontSize: 24, color: COLOR_ACCENT, bold: true, fontFace: 'Arial Black' });

        if (innovationBase64) {
            aboutSlide.addImage({ data: innovationBase64, x: 0.5, y: 1.2, w: 4.5, h: 3.5, sizing: { type: 'cover' } });
            aboutSlide.addShape('rect', { x: 0.5, y: 1.2, w: 4.5, h: 3.5, fill: { type: 'none' }, line: { color: '333333' } });
        }

        aboutSlide.addText(
            '2N es el líder mundial en sistemas de control de acceso e intercomunicadores IP. Desde 1991, hemos liderado la innovación en el sector.\n\n' +
            'Como parte de Axis Communications (Grupo Canon), nuestros productos establecen los estándares de seguridad y diseño en la industria.',
            { x: 5.2, y: 1.2, w: 7.5, h: 4, fontSize: 14, color: 'EEEEEE', align: 'left', lineSpacing: 24, valign: 'top' }
        );

        // --- 4. TIMELINE + MAP SLIDE ---
        const timeSlide = pptx.addSlide();
        timeSlide.masterName = 'MASTER_DARK';
        timeSlide.background = { color: '000000' };

        if (mapBase64) {
            timeSlide.addImage({ data: mapBase64, x: 0, y: 0, w: '100%', h: '100%', sizing: { type: 'cover' } });
            timeSlide.addShape('rect', { x: 0, y: 0, w: '100%', h: '100%', fill: '000000', transparency: 60 });
        }

        timeSlide.addText('NUESTRA HISTORIA Y ALCANCE', { x: 0.5, y: 0.5, fontSize: 24, color: COLOR_ACCENT, bold: true, fontFace: 'Arial Black' });

        // Timeline Visualization
        // Horizontal Line
        // USE STRING LITERALS FOR SHAPES!
        timeSlide.addShape('line', { x: 1, y: 4, w: 11, h: 0, line: { color: COLOR_ACCENT, width: 3 } });

        const events = [
            { year: '1991', title: 'Fundación', desc: 'Praga, CZ' },
            { year: '2008', title: '1er IP Intercom', desc: 'Revolución IP' },
            { year: '2016', title: 'Axis Group', desc: 'Adquisición' },
            { year: '2021', title: 'WaveKey', desc: 'Acceso Móvil' }
        ];

        let xPos = 1;
        events.forEach(ev => {
            // Dot (oval/ellipse)
            timeSlide.addShape('ellipse', { x: xPos, y: 3.85, w: 0.3, h: 0.3, fill: COLOR_ACCENT, line: { color: 'FFFFFF', width: 2 } });
            // Labels
            timeSlide.addText(ev.year, { x: xPos - 0.5, y: 3.3, w: 1.5, fontSize: 16, color: 'FFFFFF', bold: true, align: 'center' });
            timeSlide.addText(ev.title, { x: xPos - 0.5, y: 4.3, w: 1.5, fontSize: 12, color: 'CCCCCC', bold: true, align: 'center' });
            timeSlide.addText(ev.desc, { x: xPos - 0.5, y: 4.6, w: 1.5, fontSize: 10, color: 'AAAAAA', align: 'center' });

            xPos += 3;
        });

        // --- 5. SECTIONS ---
        if (metadata.introTitle || metadata.introText) {
            const introSlide = pptx.addSlide();
            introSlide.masterName = 'MASTER_DARK';
            introSlide.background = { color: '000000' };
            introSlide.addText((metadata.introTitle || 'Visión').toUpperCase(), { x: 0.5, y: 0.8, w: '90%', fontSize: 24, color: COLOR_ACCENT, bold: true });
            introSlide.addText(metadata.introText ? metadata.introText.replace(/<[^>]*>/g, '') : '', { x: 0.5, y: 1.5, w: 12, h: 4, fontSize: 16, color: 'EEEEEE' });
        }

        sections.forEach((section, index) => {
            this.createSectionSlide(pptx, section, index);
        });

        const safeTitle = title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        const filename = `2N_Solucion_${safeTitle}_v15_Fixed.pptx`;
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
            slide.addShape('line', { x: 0.5, y: 0.9, w: 10, h: 0, line: { color: '333333', width: 1 } });
        }

        let imgX = 0.5, imgY = 1.2, imgW = 6, imgH = 4.2;
        let txtX = 6.8, txtY = 1.2, txtW = 6.0;

        if (section.layout === 'right') {
            txtX = 0.5;
            imgX = 6.8;
        }

        if (section.imageUrl) {
            slide.addShape('rect', { x: imgX - 0.02, y: imgY - 0.02, w: imgW + 0.04, h: imgH + 0.04, fill: '111111', line: { color: '333333' } });
            if (section.imageUrl.match(/\.(mp4|webm)$/i)) {
                slide.addText("VIDEO (WEB)", { x: imgX, y: imgY, w: imgW, h: imgH, fill: '111111', align: 'center', color: '666666' });
            } else {
                slide.addImage({ path: section.imageUrl, x: imgX, y: imgY, w: imgW, h: imgH, sizing: { type: 'contain', w: imgW, h: imgH } });
            }
        }

        const cleanText = section.text ? section.text.replace(/<[^>]*>/g, '') : '';
        slide.addText(cleanText, { x: txtX, y: txtY, w: txtW, h: 4.2, fontSize: 12, color: 'CCCCCC', valign: 'top', lineSpacing: 20 });
    }

    async exportSection(section) {
        await this.exportFullPresentation(section.title || 'Slide', [section], {});
    }
}

export const pptService = new PptService();
