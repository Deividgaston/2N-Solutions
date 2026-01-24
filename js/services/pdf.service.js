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
        container.style.position = 'relative'; // FIXED: Relative positioning ensures height is respected by html2canvas
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

        // 2N CORPORATE DESIGN SYSTEM (DARK PREMIUM)
        container.innerHTML = `
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;800&display=swap');
                
                :root {
                    --2n-accent: #ffffff;
                    --2n-bg: #000000;
                    --2n-card-bg: #111111;
                    --text-body: #bbbbbb;
                    --text-light: #ffffff;
                    --2n-blue: #ffffff;
                }

                .pdf-page {
                    width: 794px;
                    height: 1122px; 
                    padding: 0;
                    margin: 0;
                    box-sizing: border-box;
                    page-break-after: always;
                    position: relative;
                    background: var(--2n-bg);
                    color: var(--text-body);
                    overflow: hidden; 
                    font-family: 'Inter', sans-serif;
                }

                /* ========================
                   Page 1: IMPACT COVER
                   ======================== */
                .cover-page {
                    background: #000;
                    color: #fff;
                    position: relative;
                }

                .cover-image {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%; /* Full Height Cover */
                    object-fit: cover;
                    opacity: 0.6;
                }
                
                .cover-gradient {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: linear-gradient(135deg, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.4) 100%);
                    z-index: 1;
                }

                .cover-logo-large {
                    position: absolute;
                    top: 60px;
                    left: 60px;
                    width: 160px; /* Prominent Logo */
                    z-index: 10;
                    filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5));
                }

                .cover-body {
                    position: absolute;
                    bottom: 80px;
                    left: 60px;
                    right: 60px;
                    z-index: 2;
                }

                .cover-badge {
                    display: inline-block;
                    padding: 8px 16px;
                    background: #fff;
                    color: #000;
                    font-size: 12px;
                    font-weight: 800;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                    margin-bottom: 30px;
                    border-radius: 2px;
                }

                .cover-title {
                    font-size: 64px;
                    font-weight: 800;
                    line-height: 1;
                    margin: 0 0 20px 0;
                    color: #fff;
                    letter-spacing: -2px;
                    text-transform: capitalize;
                }
                
                .cover-subtitle {
                    font-size: 20px;
                    color: #ccc;
                    font-weight: 300;
                    border-left: 4px solid #fff;
                    padding-left: 20px;
                    margin-top: 20px;
                }

                /* ========================
                   INTERNAL PAGES
                   ======================== */
                .page-header {
                    position: absolute;
                    top: 50px;
                    left: 60px;
                    right: 60px;
                    height: 1px;
                    background: #333;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding-bottom: 10px;
                    z-index: 10;
                }
                
                .page-header-text {
                    font-size: 10px;
                    text-transform: uppercase;
                    letter-spacing: 2px;
                    color: #666;
                    background: #000;
                    padding-right: 20px;
                    margin-top: -10px;
                }

                .page-content {
                    padding: 80px 50px 50px 50px;
                    height: 100%;
                    display: flex;
                    flex-direction: column;
                }

                .section-title {
                    font-size: 42px;
                    font-weight: 800;
                    color: #fff;
                    margin-bottom: 50px;
                    letter-spacing: -1px;
                }

                /* Context Page Grid */
                .intro-grid {
                    display: flex;
                    flex-direction: column;
                    gap: 40px;
                }

                .innovation-area {
                    position: relative;
                    margin-top: 20px;
                }
                
                .innovation-bg {
                    position: absolute;
                    top: 0; right: 0; bottom: 0; left: 0; /* Confined to content area */
                    background-image: url('assets/gold-presence-map.png');
                    background-size: cover;
                    background-position: center;
                    opacity: 0.2;
                    z-index: 0;
                    border-radius: 4px;
                }
                
                .innovation-content {
                    position: relative;
                    z-index: 1;
                    /* No padding, align flush left */
                }

                .stat-row {
                    display: flex;
                    gap: 40px;
                    margin-top: 30px;
                    border-top: 1px solid #333;
                    padding-top: 20px;
                }

                .stat-item strong {
                    font-size: 32px;
                    color: #fff;
                    display: block;
                }
                
                .stat-item span {
                    font-size: 11px;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                    color: #888;
                }

                /* Benefits List */
                .benefits-list {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 20px;
                    margin-top: 40px;
                }

                .benefit-pill {
                    background: rgba(255,255,255,0.05);
                    padding: 15px 20px;
                    font-size: 13px;
                    color: #ddd;
                    border-left: 2px solid #fff;
                    display: flex;
                    align-items: center;
                }

                /* Dynamic Sections */
                .ds-wrapper {
                    display: flex;
                    flex-direction: column;
                    gap: 60px; /* More space */
                }

                .ds-item {
                    display: flex;
                    gap: 30px;
                    align-items: flex-start;
                }
                
                .ds-item.reversed {
                    flex-direction: row-reverse;
                }

                .ds-img {
                    width: 45%; 
                    height: 220px;
                    object-fit: cover;
                    border-radius: 2px;
                    filter: grayscale(20%) contrast(110%);
                }

                .ds-content {
                    width: 55%;
                }

                .ds-content h3 {
                    font-size: 24px;
                    color: #fff;
                    margin: 0 0 15px 0;
                    font-weight: 700;
                }

                .ds-content p {
                    font-size: 14px;
                    line-height: 1.7;
                    color: #aaa;
                    margin: 0;
                }

                .page-footer {
                    position: absolute;
                    bottom: 30px;
                    left: 60px;
                    right: 60px;
                    border-top: 1px solid #333;
                    padding-top: 15px;
                    display: flex;
                    justify-content: space-between;
                    font-size: 10px;
                    color: #666;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 2px;
                }
            </style>

            <!-- PAGE 1: HERO COVER -->
            <div class="pdf-page cover-page">
                <img src="assets/pdf_cover.png" class="cover-image" onerror="this.style.display='none'">
                <div class="cover-gradient"></div>
                
                <img src="assets/2N_Logo_RGB_White.png" class="cover-logo-large">

                <div class="cover-body">
                    <span class="cover-badge">${data.verticalLabel || 'SOLUCIÓN'}</span>
                    <h1 class="cover-title">${verticalName}</h1>
                    <div class="cover-subtitle">Manual de Soluciones y Especificaciones Técnicas</div>
                </div>
            </div>

            <!-- PAGE 2: CONTEXT & VALUE -->
            <div class="pdf-page">
                <div class="page-header">
                    <span class="page-header-text">PROPUESTA DE VALOR</span>
                </div>
                
                <div class="page-content">
                    <h2 class="section-title">El Estándar 2N</h2>
                    
                    <div class="intro-grid">
                        <!-- Top Text -->
                        <div style="font-size: 16px; line-height: 1.6; color: #ccc; text-align: justify;">
                            <p>${this.companyInfo.description}</p>
                        </div>

                        <!-- Hero Area with Map -->
                        <div class="innovation-area">
                            <div class="innovation-bg"></div>
                            <div class="innovation-content">
                                <h3 style="margin-top:0; font-size:20px; color: #fff; margin-bottom: 10px;">Liderazgo Global</h3>
                                <div style="font-size: 14px; color: #bbb; margin-bottom: 0; line-height: 1.6; text-align: justify;">
                                    ${this.companyInfo.innovation}
                                </div>
                                
                                <div class="stat-row">
                                    <div class="stat-item">
                                        <strong>30+</strong>
                                        <span>Años de Historia</span>
                                    </div>
                                    <div class="stat-item">
                                        <strong>No.1</strong>
                                        <span>IP Intercoms</span>
                                    </div>
                                    <div class="stat-item">
                                        <strong>100+</strong>
                                        <span>Países</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div style="margin-top: 50px; border-top: 1px solid #222; padding-top: 30px;">
                         <h3 style="font-size: 20px; color: #fff; margin-bottom: 20px;">${data.mainTitle}</h3>
                         <div class="benefits-list">
                            ${data.benefits.map(b => `
                                <div class="benefit-pill">
                                    <span>${b}</span>
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
                backgroundColor: '#000000', // Black background
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
                    <div class="page-header">
                        <span class="page-header-text">ESPECIFICACIONES TÉCNICAS</span>
                    </div>
                    
                    <div class="page-content">
                        <div class="ds-wrapper">
                            ${pageItems.map((section, index) => this.renderSectionBlock(section, index)).join('')}
                        </div>
                    </div>

                    <div class="page-footer">
                        <span>${verticalName}</span>
                        <span>Page ${3 + Math.floor(i / itemsPerPage)}</span>
                    </div>
                </div>
            `;
        }
        return html;
    }

    renderSectionBlock(section, index) {
        // Alternate layout: Image Left for even, Image Right for odd (handled by CSS .reversed)
        const isReversed = index % 2 !== 0 ? 'reversed' : '';

        return `
            <div class="ds-item ${isReversed}">
                ${section.imageUrl ? `<img src="${section.imageUrl}" class="ds-img">` : '<div style="background:#222; height:220px; width:45%; border-radius:2px;"></div>'}
                <div class="ds-content">
                    <h3>${section.title || 'Detalle Técnico'}</h3>
                    <p>${section.text}</p>
                </div>
            </div>
        `;
    }
}

export const pdfService = new PDFService();
