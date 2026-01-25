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
                    /* VISUAL CORRECTION: Shift right to counter html2canvas layout bias */
                    padding: 80px 50px 50px 70px; /* Top, Right, Bottom, Left */
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
                    padding-top: 80px; /* Push text down to middle of map */
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

                /* Feature Cards (Values) */
                .feature-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr 1fr;
                    gap: 20px;
                }

                .feature-card {
                    background: #111; /* Dark Card */
                    border: 1px solid #222;
                    border-radius: 8px;
                    padding: 24px 20px;
                    text-align: center;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    box-shadow: 0 4px 6px rgba(0,0,0,0.3);
                }

                .feature-icon {
                    color: #3b82f6; /* 2N Blue-ish */
                    margin-bottom: 16px;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                }
                
                .feature-card h4 {
                    font-size: 16px;
                    color: #3b82f6;
                    margin: 0 0 12px 0;
                    font-weight: 700;
                }

                .feature-card p {
                    font-size: 11px;
                    line-height: 1.5;
                    color: #999;
                    margin: 0;
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

                .ds-wrapper-single {
                    display: flex;
                    flex-direction: column;
                    gap: 30px;
                    height: 100%;
                    width: 100%;
                }

                .ds-img-large {
                    width: 100%; 
                    height: 400px;
                    object-fit: cover;
                    border-radius: 4px;
                    filter: grayscale(20%) contrast(110%);
                }

                .ds-content-large h3 {
                    font-size: 28px;
                    color: #fff;
                    margin: 0 0 20px 0;
                    font-weight: 700;
                }

                .ds-content-large p {
                    font-size: 16px;
                    line-height: 1.8;
                    color: #ccc;
                    margin: 0;
                    text-align: justify;
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

                    <div style="margin-top: 50px; border-top: 1px solid #222; padding-top: 40px;">
                         <!-- FEATURE CARDS (Static 2N Values) -->
                         <div class="feature-grid">
                            <!-- Card 1 -->
                            <div class="feature-card">
                                <div class="feature-icon">
                                    <svg viewBox="0 0 24 24" width="32" height="32" stroke="#3b82f6" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="7"></circle><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline></svg>
                                </div>
                                <h4>Calidad Premium</h4>
                                <p>Diseño europeo y fabricación propia con los más altos estándares.</p>
                            </div>

                            <!-- Card 2 -->
                            <div class="feature-card">
                                <div class="feature-icon">
                                    <svg viewBox="0 0 24 24" width="32" height="32" stroke="#3b82f6" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><line x1="9" y1="18" x2="15" y2="18"></line><line x1="10" y1="22" x2="14" y2="22"></line><path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 16.5 8 4.5 4.5 0 0 0 12 3.5 4.5 4.5 0 0 0 7.5 8c0 1.42.74 2.68 1.91 3.5.76.76 1.23 1.52 1.41 2.5"></path></svg>
                                </div>
                                <h4>Innovación Continua</h4>
                                <p>Invertimos el 14% de nuestros ingresos en I+D cada año.</p>
                            </div>

                            <!-- Card 3 -->
                            <div class="feature-card">
                                <div class="feature-icon">
                                    <svg viewBox="0 0 24 24" width="32" height="32" stroke="#3b82f6" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>
                                </div>
                                <h4>Soporte Global</h4>
                                <p>Presencia en más de 100 países con soporte técnico especializado.</p>
                            </div>
                         </div>
                    </div>
                </div>

                <div class="page-footer">
                    <span>2N Solutions</span>
                    <span>2n.com</span>
                </div>
            </div>

            <!-- PAGE 3: BRIEF INTRODUCTION (Dynamic content from HTML) -->
            <div class="pdf-page">
                <div class="page-header">
                    <span class="page-header-text">INTRODUCCIÓN</span>
                </div>
                
                <div class="page-content">
                    <h2 class="section-title">${data.mainTitle || 'Solución 2N'}</h2>
                    
                    <div style="font-size: 16px; line-height: 1.8; color: #ccc; margin-bottom: 40px; text-align: justify;">
                        ${data.mainIntro.map(p => `<p>${p}</p>`).join('')}
                    </div>

                    ${data.benefits && data.benefits.length > 0 ? `
                        <h3 style="font-size: 20px; color: #3b82f6; margin-bottom: 20px;">Capacidades Clave</h3>
                        <div style="display: flex; flex-direction: column; gap: 15px;">
                            ${data.benefits.map(b => `
                                <div style="display: flex; align-items: start; gap: 15px;">
                                    <span style="color: #3b82f6; font-size: 18px; line-height: 1;">✓</span>
                                    <span style="color: #ddd; font-size: 14px; line-height: 1.5;">${b}</span>
                                </div>
                            `).join('')}
                        </div>
                    ` : ''}
                </div>

                <div class="page-footer">
                    <span>${verticalName}</span>
                    <span>2N Solutions</span>
                </div>
            </div>

            <!-- DYNAMIC PAGES -->
            ${data.dynamicSections.length > 0 ? this.renderDynamicPages(data.dynamicSections, verticalName) : ''}

            <!-- PAGE FINAL: QUE APORTA 2N (Global) -->
            <div class="pdf-page">
                <div class="page-header">
                    <span class="page-header-text">VALOR DIFERENCIAL</span>
                </div>
                
                <div class="page-content" style="justify-content: flex-start; padding-top: 60px; background-image: url('assets/extracted_map.png'); background-size: cover; background-blend-mode: overlay; background-color: rgba(0,0,0,0.85);">
                    <h2 class="section-title">QUE APORTA 2N</h2>
                    
                    <div style="display: flex; gap: 30px; align-items: flex-start;">
                         <!-- Image Left (Wide 60%) Matches PPT XML ratio (6" vs 3") -->
                         <div style="flex: 0 0 60%;">
                            <img src="assets/extracted_image9.png" onerror="this.src='assets/2N_Logo_RGB_White.png'" style="width: 100%; height: auto; border-radius: 4px; border: 1px solid #333;">
                         </div>

                         <!-- Content Right (Narrow 35%) -->
                         <div style="flex: 1;">
                            <p style="font-size: 11px; line-height: 1.5; color: #ccc; margin-bottom: 20px; text-align: justify;">
                                La seguridad física y la ciberseguridad deben ir de la mano. En 2N, no solo diseñamos soluciones avanzadas de control de accesos y videoportero, sino que también garantizamos la protección de datos y comunicaciones frente a amenazas digitales.
                            </p>

                            <div style="margin-top: 0px; display: flex; flex-direction: column; gap: 8px;">
                                <div style="display: flex; align-items: start; gap: 8px;">
                                    <span style="color: #3b82f6; font-size: 12px; margin-top: 2px;">●</span>
                                    <span style="color: #eee; font-size: 11px;"><strong>Cifrado de extremo a extremo</strong></span>
                                </div>
                                <div style="display: flex; align-items: start; gap: 8px;">
                                    <span style="color: #3b82f6; font-size: 12px; margin-top: 2px;">●</span>
                                    <span style="color: #eee; font-size: 11px;"><strong>Autenticación segura</strong></span>
                                </div>
                                <div style="display: flex; align-items: start; gap: 8px;">
                                    <span style="color: #3b82f6; font-size: 12px; margin-top: 2px;">●</span>
                                    <span style="color: #eee; font-size: 11px;"><strong>Protección contra ataques</strong></span>
                                </div>
                                <div style="display: flex; align-items: start; gap: 8px;">
                                    <span style="color: #3b82f6; font-size: 12px; margin-top: 2px;">●</span>
                                    <span style="color: #eee; font-size: 11px;"><strong>Firmware seguro y actualizaciones periódicas</strong></span>
                                </div>
                                <div style="display: flex; align-items: start; gap: 8px;">
                                    <span style="color: #3b82f6; font-size: 12px; margin-top: 2px;">●</span>
                                    <span style="color: #eee; font-size: 11px;"><strong>Cumplimiento con normativas</strong></span>
                                </div>
                            </div>
                         </div>
                    </div>
                </div>

                <div class="page-footer">
                    <span>${verticalName}</span>
                    <span>2N Solutions</span>
                </div>
            </div>
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
                backgroundColor: '#000000',
                useCORS: true,
                allowTaint: false,
                scrollY: 0,
                x: 0,
                windowWidth: 800, // Small buffer
                windowHeight: 1123
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
        // 1 Section per page for maximum size and clarity
        const itemsPerPage = 1;

        for (let i = 0; i < sections.length; i += itemsPerPage) {
            // Because itemsPerPage is 1, a slice gives us an array of 1 item
            const pageItems = sections.slice(i, i + itemsPerPage);
            const section = pageItems[0];

            html += `
                <div class="pdf-page">
                    <div class="page-header">
                        <span class="page-header-text">DETALLE TÉCNICO</span>
                    </div>
                    
                    <div class="page-content" style="justify-content: center;">
                        <div class="ds-wrapper-single">
                            ${section.imageUrl ? `<img src="${section.imageUrl}" class="ds-img-large">` : ''}
                            <div class="ds-content-large">
                                <h3>${section.title || 'Detalle Técnico'}</h3>
                                <p>${section.text}</p>
                            </div>
                        </div>
                    </div>

                    <div class="page-footer">
                        <span>${verticalName}</span>
                        <span>Page ${4 + i}</span>
                    </div>
                </div>
            `;
        }
        return html;
    }

    renderSectionBlock(section, index) {
        // Redundant with new logic but kept for safety
        return '';
    }
}

export const pdfService = new PDFService();
