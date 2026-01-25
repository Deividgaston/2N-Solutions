/**
 * 2N Presenter - PDF Handler
 * Bridges the UI and the PDFService
 */

import { pdfService } from './services/pdf.service.js';
import { pptService } from './services/ppt.service.js';
import { contentService } from './services/content.service.js';

class ExportHandler {
    constructor() {
        this.pdfBtn = document.getElementById('download-dossier-btn');
        this.pptBtn = document.getElementById('download-ppt-btn');

        this.verticalId = document.body.dataset.vertical;
        this.verticalLabel = document.querySelector('.solution-badge')?.textContent || 'Solución';
        this.verticalName = document.querySelector('h1')?.textContent || 'Dossier 2N';

        this.init();
    }

    init() {
        if (this.pdfBtn) {
            this.pdfBtn.addEventListener('click', () => this.handleExport('pdf'));
        }
        if (this.pptBtn) {
            this.pptBtn.addEventListener('click', () => this.handleExport('ppt'));
        }
    }

    async handleExport(type) {
        const btn = type === 'pdf' ? this.pdfBtn : this.pptBtn;
        const originalText = btn.innerHTML;
        const icon = type === 'pdf' ? 'fa-file-pdf' : 'fa-file-powerpoint';

        btn.disabled = true;
        btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Generando ${type.toUpperCase()}...`;

        try {
            const data = await this.gatherData();

            if (type === 'pdf') {
                await pdfService.generateDossier(this.verticalName, data);
            } else {
                await pptService.generatePresentation(this.verticalName, data);
            }

        } catch (error) {
            console.error(`Error in ${type.toUpperCase()} Export:`, error);
            alert(`No se pudo generar el ${type.toUpperCase()}. Inténtalo de nuevo.`);
        } finally {
            btn.disabled = false;
            btn.innerHTML = originalText;
        }
    }

    async gatherData() {
        // 1. Gather static content
        const mainTitle = document.querySelector('.content-main h2')?.textContent;
        const paragraphs = Array.from(document.querySelectorAll('.content-main > p')).map(p => p.textContent);
        const benefits = Array.from(document.querySelectorAll('.benefits-list li')).map(li => li.textContent.trim());

        // 2. Fetch dynamic content
        const allSections = await contentService.getSections(this.verticalId);
        // Filter out hidden sections (isVisible !== false)
        const dynamicSections = allSections.filter(s => s.isVisible !== false);

        return {
            verticalLabel: this.verticalLabel,
            mainTitle: mainTitle,
            mainIntro: paragraphs,
            benefits: benefits,
            dynamicSections: dynamicSections
        };
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    new ExportHandler();
});
