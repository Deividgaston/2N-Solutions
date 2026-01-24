/**
 * PPT Export Service using PptxGenJS
 * Generate single slide PPT from section content
 */

class PptService {
    constructor() {
        // Initialize PptxGenJS
        // Assuming global variable PptxGenJS from CDN
    }

    async exportSection(sectionData) {
        if (typeof PptxGenJS === 'undefined') {
            console.error('PptxGenJS library not loaded');
            alert('Error: Librería PPT no cargada');
            return;
        }

        const pres = new PptxGenJS();

        // 1. Setup Slide
        // 16:9 Aspect Ratio by default
        const slide = pres.addSlide();

        // 2. Add Logo (Top Right)
        slide.addText("2N Solution", { x: 8.5, y: 0.2, fontSize: 12, color: '0068B3', align: 'right' });

        // 3. Add Content
        const hasImage = !!sectionData.imageUrl;
        const textWidth = hasImage ? 5.0 : 9.0;

        // Title
        if (sectionData.title) {
            slide.addText(sectionData.title, {
                x: 0.5, y: 0.5, w: textWidth, h: 1.0,
                fontSize: 24, bold: true, color: '000000'
            });
        }

        // Text (Strip HTML)
        const plainText = sectionData.text ? sectionData.text.replace(/<[^>]*>?/gm, "") : "";
        slide.addText(plainText, {
            x: 0.5, y: 1.5, w: textWidth, h: 3.5,
            fontSize: 14, color: '333333', valign: 'top'
        });

        // Image
        if (hasImage) {
            try {
                slide.addImage({
                    path: sectionData.imageUrl,
                    x: 5.8, y: 1.5, w: 4.0, h: 3.0,
                    sizing: { type: 'contain', w: 4.0, h: 3.0 }
                });
            } catch (e) {
                console.error("Error adding image to PPT", e);
            }
        }

        // 4. Export
        const filename = `2N_Slide_${sectionData.title ? sectionData.title.substring(0, 20) : 'Section'}.pptx`;
        await pres.writeFile({ fileName: filename });
    }
}

export const pptService = new PptService();
