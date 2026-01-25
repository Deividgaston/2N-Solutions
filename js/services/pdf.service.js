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

        // --- PAGE 1: PORTADA (Background Image + Title Overlay) ---
        content.innerHTML += `
            <div class="pdf-page" style="height: 595px; width: 842px; background-image: url('assets/export_slides/cover.png'); background-size: cover; background-position: center;">
                <!-- Overlay Title for Vertical Name -->
                <div style="position: absolute; bottom: 60px; left: 40px; color: #0099ff; font-family: 'Arial Black', sans-serif; font-size: 32px; font-weight: bold; text-transform: uppercase;">
                    ${verticalName}
                </div>
            </div>
        `;

        // --- PAGE 2: INNOVACIÓN (Full Image) ---
        content.innerHTML += `
            <div class="pdf-page" style="height: 595px; width: 842px; background-image: url('assets/export_slides/innovation.png'); background-size: contain; background-repeat: no-repeat; background-position: center; background-color: #000;">
            </div>
        `;

        // --- PAGE 3: HISTORIA (Full Image) ---
        content.innerHTML += `
            <div class="pdf-page" style="height: 595px; width: 842px; background-image: url('assets/export_slides/history.png'); background-size: contain; background-repeat: no-repeat; background-position: center; background-color: #000;">
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
            <div class="pdf-page" style="height: 595px; width: 842px; background-image: url('assets/export_slides/why_2n.png'); background-size: contain; background-repeat: no-repeat; background-position: center; background-color: #000;">
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

        // Wait for images to load (heuristic)
        // await new Promise(resolve => setTimeout(resolve, 1000));

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
