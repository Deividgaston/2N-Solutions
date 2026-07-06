/**
 * 2N Presenter - PDF Handler
 * Bridges the UI and the PDFService
 */

import { pptService } from './services/ppt.service.js';
import { contentService } from './services/content.service.js';
import { pdfGodEngine } from './services/pdf.engine.v13.js';

class ExportHandler {
    constructor() {
        this.pdfBtn = document.getElementById('download-dossier-btn');
        this.pptBtn = document.getElementById('download-ppt-btn');

        this.verticalId = document.body.dataset.vertical;
        
        // These will be refreshed at handleExport time to ensure dynamic content is loaded
        this.verticalLabel = '';
        this.verticalName = '';

        this.init();
        console.log("🛠️ ExportHandler v13.0: Ready (God-Mode enabled)");
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

        btn.disabled = true;
        btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Generando ${type.toUpperCase()}...`;

        // La ventana del dossier debe abrirse EN el gesto del clic (síncrono) o
        // el bloqueador de popups la corta; el contenido se escribe después.
        let printWin = null;
        if (type === 'pdf') {
            printWin = window.open('', '_blank');
            if (printWin) {
                printWin.document.write('<!doctype html><meta charset="utf-8"><title>Generando…</title><body style="font:15px system-ui;padding:2rem;color:#334155">Generando el dossier…</body>');
            }
        }

        try {
            // Refresh names from DOM now that it's fully rendered
            let realTitle = document.querySelector('h1')?.textContent || '';
            
            // Safety: If renderer hasn't finished or failed, fallback to vertical ID
            if (!realTitle || realTitle.includes('...') || realTitle.length < 3) {
                 const vId = document.body.dataset.vertical || '2N';
                 realTitle = vId.toUpperCase();
            }

            // Format for the Cover and Heading
            this.verticalName = realTitle.toUpperCase();
            this.verticalLabel = document.querySelector('.solution-badge')?.textContent || '2N Solution';

            console.log(`🚀 Final Export v13: ${type.toUpperCase()} for ${this.verticalName}`);
            const data = await this.gatherData();

            // Pass the clean name for the file if the engine expects it
            const fileName = `Dossier_2N_${realTitle.replace(/\s+/g, '_')}`;
            
            // Meta for PPT compatibility
            data.metadata = {
                heroTitle: this.verticalName,
                introTitle: data.mainTitle,
                introText: data.mainIntro.join('\n\n')
            };

            if (type === 'pdf') {
                await pdfGodEngine.generateDossier(this.verticalName, data, printWin);
            } else {
                await pptService.exportFullPresentation(fileName, data.dynamicSections, data.metadata);
            }

        } catch (error) {
            console.error(`Error in ${type.toUpperCase()} Export:`, error);
            if (printWin) { try { printWin.close(); } catch (_) { /* noop */ } }
            alert(`No se pudo generar el ${type.toUpperCase()}. Inténtalo de nuevo.`);
        } finally {
            btn.disabled = false;
            btn.innerHTML = originalText;
        }
    }

    async gatherData() {
        // 1. Gather text content (can be dynamic if vertical-renderer updated the DOM)
        const mainTitle = document.querySelector('.content-main h2')?.textContent || document.querySelector('.intro-text h2')?.textContent;
        const techTitle = document.querySelector('.tech-section .section-title')?.textContent || 'Dispositivos Recomendados';
        const casesTitle = document.querySelector('.cases-section .section-title')?.textContent || document.querySelector('#casos h2')?.textContent || 'Casos de Éxito';
        const paragraphs = Array.from(document.querySelectorAll('.intro-text p, .content-main p')).map(p => p.textContent);
        
        // 2. Clear benefits to get the current ones (list or cards)
        let benefits = [];
        const listItems = document.querySelectorAll('.benefits-list li');
        const cardTitles = document.querySelectorAll('.benefit-card h4');
        
        if (listItems.length > 0) {
            benefits = Array.from(listItems).map(li => li.textContent.trim());
        } else if (cardTitles.length > 0) {
            benefits = Array.from(cardTitles).map(h4 => h4.textContent.trim());
        }

        // 3. Fetch dynamic content from Firebase
        const [allSections, techCards, cases, textos] = await Promise.all([
            contentService.getSections(this.verticalId),
            contentService.getGlobalProductsByVertical(this.verticalId),
            contentService.getGlobalCasesByVertical(this.verticalId),
            contentService.getWebTextos()
        ]);

        // 4. Capture current Hero Image
        const heroEl = document.querySelector('.solution-hero-bg') || document.querySelector('.solution-hero') || document.querySelector('.hero');
        let heroImageUrl = 'assets/pdf_cover.png'; // Fallback
        if (heroEl) {
            const bg = window.getComputedStyle(heroEl).backgroundImage;
            if (bg && bg !== 'none') {
                heroImageUrl = bg.replace(/url\(['"]?(.*?)['"]?\)/, '$1');
            }
        }

        return {
            verticalLabel: this.verticalLabel,
            mainTitle: mainTitle,
            techTitle: techTitle,
            casesTitle: casesTitle,
            mainIntro: paragraphs,
            // Fix: el engine v13 lee mainIntroText; sin esto la página 2 caía
            // SIEMPRE al texto genérico de relleno e ignoraba la intro real.
            mainIntroText: (paragraphs[0] || '').trim(),
            // Hook de portada = subtítulo real del hero de la vertical.
            hook: document.querySelector('.solution-subtitle')?.textContent?.trim() || '',
            benefits: benefits,
            dynamicSections: allSections.filter(s => s.isVisible !== false),
            techCards: techCards,
            cases: cases,
            heroImageUrl: heroImageUrl,
            textos: textos || null
        };
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    new ExportHandler();
});
