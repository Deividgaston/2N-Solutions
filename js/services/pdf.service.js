/**
 * 2N Presenter - PDF Generation Service
 * Converts web content into a professional PDF dossier for architects and developers.
 */

class PDFService {
    constructor() {
        this.companyInfo = {
            title: "Videoportero y Control de Accesos IP",
            description: "Desde 1991, 2N ha liderado la innovación en telecomunicaciones y control de acceso."
        };
    }

    /**
     * Generate and download a PDF dossier
     */
    async generatePdf(data) {
        if (typeof html2pdf === 'undefined') {
            alert('Error: html2pdf library not loaded.');
            return;
        }

        const title = data.vertical || 'Especificacion_2N';
        const verticalName = (data.vertical || '2N Solution').toUpperCase();

        // Container for PDF content
        const content = document.createElement('div');
        content.className = 'pdf-container';

        // Inline styles for PDF generation
        content.innerHTML = `
            <style>
                .pdf-page {
                    width: 794px; /* A4 Landscape approx width in px at 96dpi is 1123, Portrait is 794. Wait, usually landscape PDF is 1123x794 */
                    height: 560px; /* Landscape height approx */
                    /* Re-adjusting for Landscape A4: 297mm x 210mm */
                    /* html2pdf usually handles A4 sizing. Let's use standard page divs */
                    width: 100%;
                    height: 100%;
                    page-break-after: always;
                    position: relative;
                    background: #000;
                    overflow: hidden;
                    font-family: 'Arial', sans-serif;
                }
                .page-content { padding: 40px; }
            </style>
        `;

        // URL Constants
        const coverUrl = 'https://firebasestorage.googleapis.com/v0/b/nsoluciones-68554.firebasestorage.app/o/multimedia%2F2N%2F1769375753951_Portada.png?alt=media&token=2566ea37-c62e-4a62-a078-445ee34504c8';
        const innovationUrl = 'https://firebasestorage.googleapis.com/v0/b/nsoluciones-68554.firebasestorage.app/o/multimedia%2F2N%2F1769375754501_sobre_2n.png?alt=media&token=1b45b35a-1adf-4faa-bb2a-b64ea02d1a0e';
        const historyUrl = 'https://firebasestorage.googleapis.com/v0/b/nsoluciones-68554.firebasestorage.app/o/multimedia%2F2N%2F1769375752617_mapa_2n.png?alt=media&token=4b991682-1e43-4736-bf7e-e239cbe84d66';
        const why2nUrl = 'https://firebasestorage.googleapis.com/v0/b/nsoluciones-68554.firebasestorage.app/o/multimedia%2F2N%2F1769375753424_porque_2n.png?alt=media&token=34739ddd-45c7-49a4-ba5a-6b204d3e6f92';

        // Ensure title starts with "SOLUCIONES"
        let displayTitle = verticalName;
        if (!displayTitle.startsWith('SOLUCIONES')) {
            displayTitle = `SOLUCIONES ${displayTitle}`;
        }

        // --- PAGE 1: PORTADA (Background Image + Title Overlay) ---
        content.innerHTML += `
            <div class="pdf-page" style="height: 595px; width: 842px; background-image: url('${coverUrl}'); background-size: cover; background-position: center;">
                <!-- Overlay Title for Vertical Name -->
                <div style="position: absolute; bottom: 60px; left: 40px; color: #0099ff; font-family: 'Arial Black', sans-serif; font-size: 32px; font-weight: bold; text-transform: uppercase;">
                    ${displayTitle}
                </div>
            </div>
        `;

        // --- PAGE 2: INNOVACIÓN (Full Image) ---
        content.innerHTML += `
            <div class="pdf-page" style="height: 595px; width: 842px; background-image: url('${innovationUrl}'); background-size: contain; background-repeat: no-repeat; background-position: center; background-color: #000;">
            </div>
        `;

        // --- PAGE 3: HISTORIA (Full Image) ---
        content.innerHTML += `
            <div class="pdf-page" style="height: 595px; width: 842px; background-image: url('${historyUrl}'); background-size: contain; background-repeat: no-repeat; background-position: center; background-color: #000;">
            </div>
        `;

        // --- PAGE 4: INTRO (If exists) ---
        if (data.metadata?.introTitle || data.metadata?.introText) {
            content.innerHTML += `
                <div class="pdf-page" style="height: 595px; width: 842px; background: #000; color: #fff;">
                    <div style="padding: 40px;">
                        <div style="border-bottom: 1px solid #333; margin-bottom: 20px; padding-bottom: 10px; display: flex; justify-content: space-between;">
                            <span style="font-size: 10px; color: #666; text-transform: uppercase;">${verticalName}</span>
                            <span style="font-size: 10px; color: #666;">2N SOLUTIONS</span>
                        </div>
                        
                        <h2 style="color: #0099ff; font-size: 24px; font-weight: bold; margin-bottom: 20px;">
                            ${(data.metadata.introTitle || 'VISIÓN').toUpperCase()}
                        </h2>
                        
                        <div style="font-size: 14px; line-height: 1.6; color: #eee;">
                            ${data.metadata.introText || ''}
                        </div>
                    </div>
                </div>
            `;
        }


        // --- DYNAMIC PAGES (Products) ---
        if (data.dynamicSections.length > 0) {
            data.dynamicSections.forEach(section => {
                content.innerHTML += this.renderSectionPage(section, verticalName);
            });
        }

        // --- FINAL PAGE: WHY 2N (Full Image) ---
        content.innerHTML += `
            <div class="pdf-page" style="height: 595px; width: 842px; background-image: url('${why2nUrl}'); background-size: contain; background-repeat: no-repeat; background-position: center; background-color: #000;">
            </div>
        `;

        // Generate PDF
        const opt = {
            margin: 0,
            filename: `2N_Solucion_${title}_v16_Hybrid.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true, allowTaint: true },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
        };

        // Preload images to ensure they are ready for html2canvas
        const images = Array.from(content.querySelectorAll('img'));
        const bgDivs = Array.from(content.querySelectorAll('.pdf-page'));

        // Helper to load image
        const loadImg = (src) => new Promise((resolve) => {
            const img = new Image();
            img.onload = resolve;
            img.onerror = () => { console.error('Failed to load PDF asset:', src); resolve(); }; // Continue even if fail
            img.src = src;
        });

        // Collect all URls (img src and background-image)
        const urlsToLoad = [];
        images.forEach(img => urlsToLoad.push(img.src));
        bgDivs.forEach(div => {
            const style = div.style.backgroundImage;
            if (style && style !== 'none') {
                const url = style.replace(/^url\(["']?/, '').replace(/["']?\)$/, '');
                urlsToLoad.push(url);
            }
        });

        console.log('PDF: Preloading images...', urlsToLoad);
        await Promise.all(urlsToLoad.map(loadImg));

        // Use html2pdf
        html2pdf().set(opt).from(content).save();
    }

    renderSectionPage(section, verticalName) {
        return `
            <div class="pdf-page" style="height: 595px; width: 842px; background: #000; color: #fff;">
                <div style="padding: 40px;">
                     <div style="border-bottom: 1px solid #333; margin-bottom: 20px; padding-bottom: 10px; display: flex; justify-content: space-between;">
                        <span style="font-size: 10px; color: #666; text-transform: uppercase;">${verticalName}</span>
                        <span style="font-size: 10px; color: #666;">2N SOLUTIONS</span>
                    </div>
                
                    <h2 style="font-size: 22px; color: #fff; margin-bottom: 30px; font-weight: bold;">${section.title || 'Sección'}</h2>
                    
                    <div style="display: flex; gap: 40px; align-items: flex-start;">
                        <!-- Image Container with Dark Frame -->
                        <div style="flex: 1; background: #111; padding: 10px; border: 1px solid #333; border-radius: 4px;">
                            ${section.imageUrl ?
                `<img src="${section.imageUrl}" style="width: 100%; height: auto; display: block;">` :
                '<div style="color: #666; text-align: center; padding: 50px;">Sin Imagen</div>'}
                        </div>
                        
                        <!-- Text -->
                        <div style="flex: 1; color: #ccc; font-size: 12px; line-height: 1.6;">
                            ${section.text || ''}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
}

export const pdfService = new PDFService();
