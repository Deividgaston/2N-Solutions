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
        // Create a hidden container for PDF generation
        const container = document.createElement('div');
        container.style.position = 'absolute';
        container.style.left = '-9999px';
        container.style.width = '800px'; // Fixed width for consistent rendering
        container.style.backgroundColor = '#000';
        container.style.color = '#fff';
        container.style.fontFamily = "'Inter', sans-serif";
        document.body.appendChild(container);

        // Build HTML structure
        container.innerHTML = `
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
                
                .pdf-page {
                    width: 100%;
                    min-height: 1120px; /* A4-ish height */
                    padding: 80px 60px;
                    box-sizing: border-box;
                    page-break-after: always;
                    position: relative;
                    background: #000;
                }
                
                /* Cover Page */
                .cover-page {
                    display: flex;
                    flex-direction: column;
                    justify-content: space-between;
                    background-image: linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.8)), url('assets/pdf_cover.png');
                    background-size: cover;
                    background-position: center;
                }
                
                .logo-header { text-align: right; }
                .logo-header img { height: 40px; }
                
                .cover-footer h1 {
                    font-size: 64px;
                    font-weight: 900;
                    margin: 0;
                    letter-spacing: -2px;
                }
                
                .cover-footer .subtitle {
                    font-size: 24px;
                    color: #0099FF;
                    margin-top: 10px;
                }
                
                /* Common Styles */
                h2 { font-size: 32px; font-weight: 800; color: #0099FF; margin-bottom: 30px; }
                p { line-height: 1.6; color: #aaa; margin-bottom: 20px; font-size: 16px; }
                
                .section-badge {
                    display: inline-block;
                    padding: 6px 12px;
                    border: 1px solid #0099FF;
                    border-radius: 50px;
                    color: #0099FF;
                    font-size: 12px;
                    font-weight: 700;
                    text-transform: uppercase;
                    margin-bottom: 20px;
                }
                
                .benefit-item {
                    display: flex;
                    gap: 15px;
                    margin-bottom: 15px;
                }
                
                .benefit-item .icon { color: #0099FF; font-weight: bold; }
                
                /* Dynamic Sections */
                .ds-block {
                    margin-top: 50px;
                    border-top: 1px solid #222;
                    padding-top: 50px;
                }
                
                .ds-title { font-size: 24px; margin-bottom: 15px; color: #fff; }
                .ds-img {
                    width: 100%;
                    border-radius: 12px;
                    margin-bottom: 20px;
                    max-height: 400px;
                    object-fit: cover;
                }
                
                .footer-page {
                    position: absolute;
                    bottom: 40px;
                    left: 60px;
                    right: 60px;
                    display: flex;
                    justify-content: space-between;
                    font-size: 10px;
                    color: #444;
                    border-top: 1px solid #111;
                    padding-top: 10px;
                }
            </style>

            <!-- PAGE 1: COVER -->
            <div class="pdf-page cover-page">
                <div class="logo-header">
                    <img src="assets/2N_Logo_RGB_White.png" alt="2N Logo">
                </div>
                <div class="cover-footer">
                    <span class="section-badge">${data.verticalLabel || 'Solución'}</span>
                    <h1>${verticalName}</h1>
                    <p class="subtitle">Propuesta tecnológica para prescriptores</p>
                </div>
            </div>

            <!-- PAGE 2: ABOUT 2N -->
            <div class="pdf-page">
                <div class="logo-header" style="margin-bottom: 60px;">
                    <img src="assets/2N_Logo_RGB_White.png" alt="2N Logo">
                </div>
                
                <span class="section-badge">Sobre Nosotros</span>
                <h2>${this.companyInfo.title}</h2>
                <p style="font-size: 18px; color: #eee;">${this.companyInfo.description}</p>
                <p>${this.companyInfo.innovation}</p>
                
                <div style="margin-top: 60px;">
                    <h3>Líderes en Innovación</h3>
                    <p>Como parte de Axis Communications, 2N integra las tecnologías más avanzadas de vídeo y audio IP para ofrecer la mayor fiabilidad del mercado.</p>
                </div>

                <div class="footer-page">
                    <span>© 2024 2N Telekomunikace a.s.</span>
                    <span>2n.com</span>
                </div>
            </div>

            <!-- PAGE 3+: SOLUTION DETAILS & DYNAMIC CONTENT -->
            <div class="pdf-page">
                <div class="logo-header" style="margin-bottom: 40px;">
                    <img src="assets/2N_Logo_RGB_White.png" alt="2N Logo">
                </div>
                
                <span class="section-badge">Dossier de Solución</span>
                <h2>${data.mainTitle || 'El Reto'}</h2>
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
                    <span>Dossier ${verticalName}</span>
                    <span>Página 3</span>
                </div>
            </div>
            
            ${data.dynamicSections.length > 0 ? this.renderDynamicPages(data.dynamicSections, verticalName) : ''}
        `;

        // Wait for images to potentially load (even if they are local)
        await new Promise(resolve => setTimeout(resolve, 500));

        // Options for html2pdf
        const opt = {
            margin: 0,
            filename: `Dossier_2N_${verticalName.replace(/\s+/g, '_')}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: {
                scale: 2,
                logging: false,
                backgroundColor: '#000',
                useCORS: true
            },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        try {
            // Generate PDF
            await html2pdf().set(opt).from(container).save();
        } catch (error) {
            console.error('PDF Generation error:', error);
            alert('Error al generar el PDF. Por favor, inténtalo de nuevo.');
        } finally {
            // Cleanup
            document.body.removeChild(container);
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
