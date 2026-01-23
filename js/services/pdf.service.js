/**
 * 2N Presenter - PDF Generation Service
 * Converts web content into a professional PDF dossier for architects and developers.
 */

class PDFService {
    constructor() {
        this.companyInfo = {
            title: "Videoportero y Control de Accesos IP",
            description: "Desde 1991, 2N ha liderado la innovación en telecomunicaciones y control de acceso. Hoy, como parte del grupo Axis Communications, definimos el estándar mundial en seguridad y diseño.",
            innovation: "2N es una empresa líder mundial en el desarrollo y fabricación de sistemas de control de acceso e intercomunicadores IP. Nuestros productos se encuentran en los edificios más emblemáticos del mundo, desde oficinas corporativas en Nueva York hasta complejos residenciales de lujo en Dubái."
        };
    }

    /**
     * Generate and download a PDF dossier for a vertical
     * @param {string} verticalName - The display name of the vertical
     * @param {Object} data - Data to include in the PDF
     */
    async generateDossier(verticalName, data) {
        if (typeof html2pdf === 'undefined') {
            alert('CRITICAL ERROR: La librería "html2pdf" no se ha cargado. Revisa tu conexión o la consola.');
            return;
        }

        // Create a hidden but present container for PDF generation
        // Create a hidden but present container for PDF generation
        const container = document.createElement('div');
        container.id = 'pdf-generation-container';
        container.style.position = 'absolute';
        container.style.top = '0';
        container.style.left = '0';
        container.style.width = '794px'; // A4 Width
        container.style.minHeight = '1123px';
        container.style.zIndex = '9998';
        container.style.display = 'block';
        container.style.backgroundColor = '#1a1a1a';
        container.style.color = '#fff';
        container.style.fontFamily = "'Inter', sans-serif";
        document.body.appendChild(container);

        // Create curtain
        const curtain = document.createElement('div');
        curtain.id = 'pdf-curtain';
        curtain.style.position = 'fixed';
        curtain.style.inset = '0';
        curtain.style.backgroundColor = '#111';
        curtain.style.zIndex = '9999';
        curtain.style.display = 'flex';
        curtain.style.flexDirection = 'column';
        curtain.style.alignItems = 'center';
        curtain.style.justifyContent = 'center';
        curtain.innerHTML = `
            <div style="font-size: 24px; font-weight: 800; color: #fff; margin-bottom: 10px; font-family: 'Inter', sans-serif;">Generando Dossier 2N...</div>
            <div style="color: #0068B3; font-family: 'Inter', sans-serif;">Por favor espere</div>
        `;
        document.body.appendChild(curtain);

        // 2N CORPORATE DESIGN SYSTEM
        container.innerHTML = `
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;800&display=swap');
                
                :root {
                    --2n-blue: #0068B3; /* Official 2N Blue */
                    --2n-dark: #121212;
                    --2n-gray: #f4f4f4;
                    --text-body: #333333;
                    --text-light: #ffffff;
                }

                .pdf-page {
                    width: 794px;
                    height: 1122px; /* Strict A4 page */
                    padding: 0;
                    margin: 0;
                    box-sizing: border-box;
                    page-break-after: always;
                    position: relative;
                    background: #fff; /* Paper background */
                    color: var(--text-body);
                    overflow: hidden; /* Strict overflow to force correct paging */
                    font-family: 'Inter', sans-serif;
                }

                /* ========================
                   PAGE 1: HERO COVER
                   ======================== */
                .cover-page {
                    background: #000;
                    color: #fff;
                }

                .cover-image {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 65%; /* Dominant image */
                    object-fit: cover;
                    opacity: 0.8;
                }
                
                .cover-gradient {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 65%;
                    background: linear-gradient(to bottom, rgba(0,0,0,0.1), #000);
                    z-index: 1;
                }

                .cover-header {
                    position: absolute;
                    top: 40px;
                    right: 40px;
                    z-index: 10;
                    width: 120px;
                }

                .cover-body {
                    position: absolute;
                    bottom: 0;
                    left: 0;
                    width: 100%;
                    height: 35%;
                    background: #000;
                    padding: 40px 60px;
                    box-sizing: border-box;
                    z-index: 2;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                }

                .cover-badge {
                    font-size: 12px;
                    letter-spacing: 2px;
                    text-transform: uppercase;
                    color: var(--2n-blue);
                    font-weight: 800;
                    margin-bottom: 20px;
                }

                .cover-title {
                    font-size: 52px;
                    font-weight: 300; /* Light */
                    line-height: 1.1;
                    margin: 0;
                    color: #fff;
                }
                
                .cover-title strong {
                    font-weight: 800; /* Bold */
                }

                .cover-line {
                    width: 60px;
                    height: 4px;
                    background: var(--2n-blue);
                    margin: 25px 0;
                }

                .cover-subtitle {
                    font-size: 16px;
                    color: #888;
                }

                /* ========================
                   INTERNAL PAGES
                   ======================== */
                .page-header {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 8px; /* Blue strip */
                    background: var(--2n-blue);
                    z-index: 100;
                }

                .page-content {
                    padding: 80px 60px 60px 60px;
                    height: 100%;
                    display: flex;
                    flex-direction: column;
                }

                .page-logo {
                    position: absolute;
                    top: 40px;
                    right: 60px;
                    width: 40px;
                }

                .section-title {
                    font-size: 32px;
                    font-weight: 800;
                    color: #000;
                    margin-bottom: 40px;
                    letter-spacing: -1px;
                }
                
                .section-title span {
                    color: var(--2n-blue);
                }

                /* About Page */
                .about-grid {
                    display: grid;
                    grid-template-columns: 1fr 1.5fr;
                    gap: 40px;
                    height: 100%;
                }

                .about-text {
                    font-size: 14px;
                    line-height: 1.8;
                    color: #555;
                }

                .about-highlight {
                    font-size: 18px;
                    font-weight: 600;
                    color: #000;
                    margin-bottom: 20px;
                }

                /* Benefits */
                .benefits-grid {
                    display: grid;
                    grid-template-columns: 1fr;
                    gap: 20px;
                }

                .benefit-card {
                    background: #f8f9fa;
                    padding: 20px;
                    border-left: 4px solid var(--2n-blue);
                    display: flex;
                    gap: 15px;
                    align-items: center;
                }

                .benefit-icon {
                    color: var(--2n-blue);
                    font-size: 20px;
                }

                .benefit-text {
                    font-size: 14px;
                    font-weight: 500;
                    color: #333;
                }

                /* Dynamic Sections */
                .ds-wrapper {
                    display: flex;
                    flex-direction: column;
                    gap: 40px;
                    height: 100%;
                }

                .ds-item {
                    display: grid;
                    grid-template-columns: 1fr 1fr; /* Image Left, Text Right */
                    gap: 30px;
                    align-items: center;
                    padding-bottom: 30px;
                    border-bottom: 1px solid #eee;
                }
                
                .ds-item.reversed {
                    grid-template-columns: 1fr 1fr;
                    direction: rtl; /* Flip order visually */
                }
                
                .ds-item.reversed .ds-content {
                    direction: ltr; /* Restore text direction */
                }

                .ds-img {
                    width: 100%;
                    height: 250px;
                    object-fit: cover;
                    border-radius: 4px;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                }

                .ds-content h3 {
                    font-size: 20px;
                    font-weight: 700;
                    color: #000;
                    margin-bottom: 15px;
                    margin-top: 0;
                }

                .ds-content p {
                    font-size: 13px;
                    line-height: 1.6;
                    color: #666;
                    white-space: pre-line;
                }

                /* Footer */
                .page-footer {
                    position: absolute;
                    bottom: 30px;
                    left: 60px;
                    right: 60px;
                    border-top: 1px solid #eee;
                    padding-top: 15px;
                    display: flex;
                    justify-content: space-between;
                    font-size: 10px;
                    color: #999;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                }
            </style>

            <!-- PAGE 1: HERO -->
            <div class="pdf-page cover-page">
                <img src="assets/pdf_cover.png" class="cover-image">
                <div class="cover-gradient"></div>
                
                <img src="assets/2N_Logo_RGB_White.png" class="cover-header">

                <div class="cover-body">
                    <div class="cover-badge">${data.verticalLabel || 'SOLUCIÓN'}</div>
                    <h1 class="cover-title">Dossier Técnico<br><strong>${verticalName}</strong></h1>
                    <div class="cover-line"></div>
                    <div class="cover-subtitle">Prepared for Architects & Engineers</div>
                </div>
            </div>

            <!-- PAGE 2: CONTEXT -->
            <div class="pdf-page">
                <div class="page-header"></div>
                <img src="assets/2N_Logo_RGB_White.png" style="filter: invert(1);" class="page-logo">
                
                <div class="page-content">
                    <h2 class="section-title">Why <span>2N</span>?</h2>
                    
                    <div class="about-grid">
                        <div>
                            <p class="about-highlight">${this.companyInfo.title}</p>
                            <p class="about-text">${this.companyInfo.description}</p>
                        </div>
                        <div style="background: #f4f4f4; padding: 30px; border-radius: 8px;">
                            <h3 style="margin-top:0; font-size:16px;">Global Innovation</h3>
                            <p class="about-text" style="font-size:13px;">${this.companyInfo.innovation}</p>
                            <div style="margin-top: 40px; display:flex; gap: 20px;">
                                <div>
                                    <strong style="display:block; font-size: 24px; color: var(--2n-blue);">30+</strong>
                                    <span style="font-size:10px; text-transform:uppercase;">Years</span>
                                </div>
                                <div>
                                    <strong style="display:block; font-size: 24px; color: var(--2n-blue);">No.1</strong>
                                    <span style="font-size:10px; text-transform:uppercase;">IP Intercoms</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div style="margin-top: 60px;">
                         <h2 class="section-title" style="font-size: 24px; margin-bottom: 30px;">${data.mainTitle}</h2>
                         <div class="benefits-grid">
                            ${data.benefits.map(b => `
                                <div class="benefit-card">
                                    <span class="benefit-icon">✓</span>
                                    <span class="benefit-text">${b}</span>
                                </div>
                            `).join('')}
                         </div>
                    </div>
                </div>

                <div class="page-footer">
                    <span>2N Solutions</span>
                    <span>2n.com</span>
                </div>
            </div>

            <!-- DYNAMIC PAGES -->
            ${data.dynamicSections.length > 0 ? this.renderDynamicPages(data.dynamicSections, verticalName) : ''}
        `;

        // Function to wait or images
        const waitForImages = () => {
            const imgs = container.querySelectorAll('img');
            const promises = Array.from(imgs).map(img => {
                if (img.complete) return Promise.resolve();
                return new Promise(resolve => {
                    img.onload = resolve;
                    img.onerror = resolve;
                });
            });
            return Promise.all(promises);
        };

        await waitForImages();
        await new Promise(resolve => setTimeout(resolve, 800));

        const opt = {
            margin: 0,
            filename: `Dossier_2N_${verticalName.replace(/\s+/g, '_')}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: {
                scale: 2,
                logging: true,
                backgroundColor: '#fff', // White background
                useCORS: true,
                allowTaint: false,
                scrollY: 0,
                windowWidth: 1200,
                windowHeight: 2000
            },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        try {
            const worker = html2pdf().set(opt).from(container);
            await worker.save();
        } catch (error) {
            console.error('PDF Generation error:', error);
            alert(`Error al generar el PDF: ${error.message || error}`);
        } finally {
            document.body.removeChild(container);
            if (document.body.contains(curtain)) {
                document.body.removeChild(curtain);
            }
        }
    }

    renderDynamicPages(sections, verticalName) {
        let html = '';
        // 2 Sections per page to ensure space
        const itemsPerPage = 2;

        for (let i = 0; i < sections.length; i += itemsPerPage) {
            const pageItems = sections.slice(i, i + itemsPerPage);

            html += `
                <div class="pdf-page">
                    <div class="page-header"></div>
                    <img src="assets/2N_Logo_RGB_White.png" style="filter: invert(1);" class="page-logo">
                    
                    <div class="page-content">
                        <div class="ds-wrapper">
                            ${pageItems.map((section, index) => this.renderSectionBlock(section, index)).join('')}
                        </div>
                    </div>

                    <div class="page-footer">
                        <span>${verticalName} · Technical Details</span>
                        <span>Page ${3 + Math.floor(i / itemsPerPage)}</span>
                    </div>
                </div>
            `;
        }
        return html;
    }

    renderSectionBlock(section, index) {
        // Alternate layout: Image Left for even, Image Right for odd
        const isReversed = index % 2 !== 0 ? 'reversed' : '';

        return `
            <div class="ds-item ${isReversed}">
                ${section.imageUrl ? `<img src="${section.imageUrl}" class="ds-img">` : '<div style="background:#eee; height:250px; border-radius:4px;"></div>'}
                <div class="ds-content">
                    <h3>${section.title || 'Section'}</h3>
                    <p>${section.text}</p>
                </div>
            </div>
        `;
    }
}

export const pdfService = new PDFService();
