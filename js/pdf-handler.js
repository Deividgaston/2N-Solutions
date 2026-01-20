/**
 * 2N Presenter - PDF Handler
 * Bridges the UI and the PDFService
 */

import { pdfService } from './services/pdf.service.js';
import { contentService } from './services/content.service.js';

class PDFHandler {
    constructor() {
        this.downloadBtn = document.getElementById('download-dossier-btn');
        this.verticalId = document.body.dataset.vertical;
        this.verticalLabel = document.querySelector('.solution-badge')?.textContent || 'Solución';
        this.verticalName = document.querySelector('h1')?.textContent || 'Dossier 2N';

        if (this.downloadBtn) {
            this.init();
        }
    }

    init() {
        this.downloadBtn.addEventListener('click', () => this.handleDownload());
    }

    async handleDownload() {
        const originalText = this.downloadBtn.innerHTML;
        this.downloadBtn.disabled = true;
        this.downloadBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Generando...';

        try {
            // 1. Gather static content
            const mainTitle = document.querySelector('.content-main h2')?.textContent;
            const paragraphs = Array.from(document.querySelectorAll('.content-main > p')).map(p => p.textContent);
            const benefits = Array.from(document.querySelectorAll('.benefits-list li')).map(li => li.textContent.trim());

            // 2. Fetch dynamic content directly from service to ensure we have all data
            // (Even if not currently scrolled into view)
            const dynamicSections = await contentService.getSections(this.verticalId);

            // 3. Prepare data object
            const pdfData = {
                verticalLabel: this.verticalLabel,
                mainTitle: mainTitle,
                mainIntro: paragraphs,
                benefits: benefits,
                dynamicSections: dynamicSections // Array of {title, text, imageUrl}
            };

            // 4. Trigger generation
            await pdfService.generateDossier(this.verticalName, pdfData);

        } catch (error) {
            console.error('Error in PDF Handler:', error);
            alert('No se pudo generar el dossier. Inténtalo de nuevo.');
        } finally {
            this.downloadBtn.disabled = false;
            this.downloadBtn.innerHTML = originalText;
        }
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    new PDFHandler();
});
