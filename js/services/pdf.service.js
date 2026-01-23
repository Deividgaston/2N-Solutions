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
        // Create a hidden but present container for PDF generation
        const container = document.createElement('div');
        container.id = 'pdf-generation-container';
        // Strategy: Place ON TOP to ensure rendering, but cover with a curtain
        container.style.position = 'fixed';
        container.style.top = '0';
        container.style.left = '0';
        container.style.width = '800px'; // Fixed A4 width context
        container.style.zIndex = '9998'; // High Z-index
        container.style.opacity = '1';
        container.style.backgroundColor = '#000';
        container.style.color = '#fff';
        container.style.fontFamily = "'Inter', sans-serif";
        document.body.appendChild(container);

        // Create a curtain to hide the flickering/rendering process from user
        const curtain = document.createElement('div');
        curtain.id = 'pdf-curtain';
        curtain.style.position = 'fixed';
        curtain.style.inset = '0';
        curtain.style.backgroundColor = '#000';
        curtain.style.zIndex = '9999'; // On top of everything
        curtain.style.display = 'flex';
        curtain.style.flexDirection = 'column';
        curtain.style.alignItems = 'center';
        curtain.style.justifyContent = 'center';
        curtain.innerHTML = `
            <div style="font-size: 24px; font-weight: bold; margin-bottom: 10px;">Generando Dossier PDF...</div>
            <div style="color: #666;">Por favor espere unos segundos</div>
        `;
        document.body.appendChild(curtain);

        // Build HTML structure
        container.innerHTML = `
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
                
                .pdf-page {
                    width: 794px; /* A4 width at 96 DPI approx */
                    min-height: 1122px; 
                    padding: 60px;
                    box-sizing: border-box;
                    page-break-after: always;
                    position: relative;
                    background: #ffffff; /* FORCE WHITE BG */
                    color: #000000; /* FORCE BLACK TEXT */
                    overflow: hidden;
                }
                
                /* Cover Page */
                .cover-page {
                    display: flex;
                    flex-direction: column;
                    justify-content: space-between;
                    padding: 0;
                }
                
                .cover-img-wrapper {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    z-index: 1;
                }
                
                .cover-img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }
                
                .cover-overlay {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: linear-gradient(rgba(0,0,0,0.2), rgba(0,0,0,0.9));
                    z-index: 2;
                }
                
                .cover-content {
                    position: relative;
                    z-index: 3;
                    height: 100%;
                    display: flex;
                    flex-direction: column;
                    justify-content: space-between;
                    padding: 60px;
                }

                .logo-header { text-align: right; }
                .logo-header img { height: 40px; }
                
                .cover-footer h1 {
                    font-size: 56px;
                    font-weight: 900;
                    margin: 0;
                    letter-spacing: -2px;
                    color: #fff;
                }
                
                .cover-footer .subtitle {
                    font-size: 22px;
                    color: #0099FF;
                    margin-top: 10px;
                    font-weight: 600;
                }
                
                /* Common Styles */
                h2 { font-size: 32px; font-weight: 800; color: #0055aa; margin-bottom: 30px; }
                h3 { font-size: 20px; font-weight: 700; color: #000; margin-bottom: 20px; }
                p { line-height: 1.6; color: #333; margin-bottom: 20px; font-size: 16px; }
                
                .section-badge {
                    display: inline-block;
                    padding: 6px 14px;
                    border: 1px solid #0099FF;
                    border-radius: 50px;
                    color: #0099FF;
                    font-size: 11px;
                    font-weight: 800;
                    text-transform: uppercase;
                    margin-bottom: 25px;
                    letter-spacing: 1px;
                }
                
                .benefit-item {
                    display: flex;
                    gap: 15px;
                    margin-bottom: 18px;
                    align-items: flex-start;
                }
                
                .benefit-item .icon { 
                    color: #0099FF; 
                    font-weight: bold; 
                    font-size: 20px;
                    line-height: 1;
                }
                
                /* Dynamic Sections */
                .ds-block {
                    margin-top: 40px;
                    border-top: 1px solid #222;
                    padding-top: 40px;
                }
                
                .ds-title { font-size: 24px; margin-bottom: 15px; color: #fff; font-weight: 700; }
                .ds-img {
                    width: 100%;
                    border-radius: 12px;
                    margin-bottom: 20px;
                    max-height: 350px;
                    object-fit: cover;
                }
                
                .footer-page {
                    position: absolute;
                    bottom: 40px;
                    left: 60px;
                    right: 60px;
                    display: flex;
                    justify-content: space-between;
                    font-size: 11px;
                    color: #555;
                    border-top: 1px solid #222;
                    padding-top: 15px;
                }
            </style>

            <!-- PAGE 1: COVER -->
            <div class="pdf-page cover-page">
                <div class="cover-img-wrapper">
                    <img src="assets/pdf_cover.png" class="cover-img">
                    <div class="cover-overlay"></div>
                </div>
                <div class="cover-content">
                    <div class="logo-header">
                        <img src="assets/2N_Logo_RGB_White.png" alt="2N Logo">
                    </div>
                    <div class="cover-footer">
                        <span class="section-badge">${data.verticalLabel || 'Solución'}</span>
                        <h1>${verticalName}</h1>
                        <p class="subtitle">Dossier Técnico para Prescriptores</p>
                    </div>
                </div>
            </div>

            <!-- PAGE 2: ABOUT 2N -->
            <div class="pdf-page">
                <div class="logo-header" style="margin-bottom: 60px;">
                    <img src="assets/2N_Logo_RGB_White.png" alt="2N Logo">
                </div>
                
                <span class="section-badge">Sobre Nosotros</span>
                <h2>${this.companyInfo.title}</h2>
                <p style="font-size: 18px; color: #fff; font-weight: 500;">${this.companyInfo.description}</p>
                <p>${this.companyInfo.innovation}</p>
                
                <div style="margin-top: 60px; padding: 30px; background: #111; border-radius: 16px; border: 1px solid #222;">
                    <h3 style="margin-top: 0;">Líderes en Innovación</h3>
                    <p style="margin-bottom: 0;">Como parte de Axis Communications (Grupo Canon), 2N integra las tecnologías más avanzadas de vídeo y audio IP para ofrecer la mayor fiabilidad y diseño del mercado global.</p>
                </div>

                <div class="footer-page">
                    <span>© 2024 2N Telekomunikace a.s. · Parte de Axis Communications</span>
                    <span>2n.com</span>
                </div>
            </div>

            <!-- PAGE 3+: SOLUTION DETAILS & DYNAMIC CONTENT -->
            <div class="pdf-page">
                <div class="logo-header" style="margin-bottom: 40px;">
                    <img src="assets/2N_Logo_RGB_White.png" alt="2N Logo">
                </div>
                
                <span class="section-badge">Dossier de Solución</span>
                <h2>${data.mainTitle || 'Propuesta de Valor'}</h2>
                <div style="margin-bottom: 40px;">
                    ${data.mainIntro.map(p => `<p>${p}</p>`).join('')}
                </div>

                <h3>Beneficios Clave</h3>
                <div class="benefits-container">
                    ${data.benefits.map(b => `
                        <div class="benefit-item">
                            <span class="icon">✓</span>
                            <span>${b}</span>
                        </div>
                    `).join('')}
                </div>

                <div class="footer-page">
                    <span>Propuesta Técnica: ${verticalName}</span>
                    <span>Página 3</span>
                </div>
            </div>
            
            ${data.dynamicSections.length > 0 ? this.renderDynamicPages(data.dynamicSections, verticalName) : ''}
        `;

        // Function to wait for all images in the container
        const waitForImages = () => {
            const imgs = container.querySelectorAll('img');
            const promises = Array.from(imgs).map(img => {
                if (img.complete) return Promise.resolve();
                return new Promise(resolve => {
                    img.onload = resolve;
                    img.onerror = resolve; // Continue anyway on error
                });
            });
            return Promise.all(promises);
        };

        // Explicitly wait for images
        await waitForImages();
        // Small extra delay for fonts and layout settling
        await new Promise(resolve => setTimeout(resolve, 800));

        // Options for html2pdf
        const opt = {
            margin: 0,
            filename: `Dossier_2N_${verticalName.replace(/\s+/g, '_')}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: {
                scale: 2,
                logging: false,
                backgroundColor: '#000',
                useCORS: true,
                allowTaint: true,
                scrollY: 0,
                windowWidth: 1200
            },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        try {
            // Generate PDF
            const worker = html2pdf().set(opt).from(container);
            await worker.save();
        } catch (error) {
            console.error('PDF Generation error:', error);
            alert('Error al generar el PDF. Por favor, asegúrate de estar conectado a internet.');
        } finally {
            // Cleanup
            document.body.removeChild(container);
            if (document.body.contains(curtain)) {
                document.body.removeChild(curtain);
            }
        }
    }

    renderDynamicPages(sections, verticalName) {
        let html = '';
        // Group dynamic sections in pairs or one per page depending on content length
        // For simplicity and premium look, let's do 1 or 2 sections per page

        for (let i = 0; i < sections.length; i += 2) {
            html += `
                <div class="pdf-page">
                    <div class="logo-header" style="margin-bottom: 40px;">
                        <img src="assets/2N_Logo_RGB_White.png" alt="2N Logo">
                    </div>
                    
                    ${this.renderSectionBlock(sections[i])}
                    
                    ${sections[i + 1] ? `<div class="ds-block">${this.renderSectionBlock(sections[i + 1])}</div>` : ''}

                    <div class="footer-page">
                        <span>Contenidos Adicionales - ${verticalName}</span>
                        <span>Página ${4 + Math.floor(i / 2)}</span>
                    </div>
                </div>
            `;
        }
        return html;
    }

    renderSectionBlock(section) {
        return `
            ${section.imageUrl ? `<img src="${section.imageUrl}" class="ds-img">` : ''}
            <h3 class="ds-title">${section.title || ''}</h3>
            <div style="color: #aaa; line-height: 1.6; font-size: 14px; white-space: pre-line;">
                ${section.text}
            </div>
        `;
    }
}

export const pdfService = new PDFService();
