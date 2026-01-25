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
     * Generate and download a PDF dossier
     */
    async generatePdf(data) {
        if (typeof html2pdf === 'undefined') {
            alert('CRITICAL ERROR: La librería "html2pdf" no se ha cargado. Revisa tu conexión o la consola.');
            return;
        }

        // --- 1. PREPARE DATA ---
        const verticalRaw = data.vertical || data.metadata?.heroTitle || '2N Solution';
        const mapTitle = (t) => {
            const lower = t.toLowerCase();
            if (lower.includes('bts')) return 'SOLUCIONES RESIDENCIAL BTS';
            if (lower.includes('btr')) return 'SOLUCIONES RESIDENCIAL BTR';
            if (lower.includes('office') || lower.includes('oficina')) return 'SOLUCIONES OFICINAS';
            if (lower.includes('hotel')) return 'SOLUCIONES HOTELES';
            if (lower.includes('retail')) return 'SOLUCIONES RETAIL';
            if (lower.includes('security') || lower.includes('seguridad')) return 'SOLUCIONES SEGURIDAD';
            return t.toUpperCase().startsWith('SOLUCIONES') ? t.toUpperCase() : `SOLUCIONES ${t.toUpperCase()}`;
        };
        const verticalName = mapTitle(verticalRaw);

        // Assets
        // Use Firebase for Cover (User Request)
        const coverUrl = 'https://firebasestorage.googleapis.com/v0/b/nsoluciones-68554.firebasestorage.app/o/multimedia%2F2N%2F1769375753951_Portada.png?alt=media&token=2566ea37-c62e-4a62-a078-445ee34504c8';
        // Use Local Assets for Layout Fidelity (User "El de antes" Request)
        const worldMapUrl = 'assets/world-map.svg';
        const extractedMapUrl = 'assets/extracted_map.png';
        const buildingImgUrl = 'assets/extracted_image9.png';

        // --- 2. SETUP CONTAINER ---
        const container = document.createElement('div');
        container.id = 'pdf-generation-container';
        container.style.position = 'relative';
        container.style.width = '794px';
        container.style.minHeight = '1123px';
        container.style.zIndex = '9998';
        container.style.background = '#000';
        container.style.color = '#fff';
        container.style.fontFamily = "'Inter', sans-serif";
        document.body.appendChild(container);

        // Curtain
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
            <div style="font-size: 24px; font-weight: 800; color: #fff; margin-bottom: 10px; font-family: sans-serif;">Generando Dossier 2N...</div>
            <div style="color: #0099FF; font-family: sans-serif;">Por favor espere</div>
        `;
        document.body.appendChild(curtain);

        // --- 3. BUILD CONTENT (MATCHING ORIGINAL COMMIT 60f1557) ---
        container.innerHTML = `
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;800&display=swap');
                
                :root { --2n-blue: #0099FF; }

                .pdf-page {
                    width: 794px;
                    height: 1122px; 
                    position: relative;
                    background: #000;
                    color: #ccc;
                    overflow: hidden; 
                    font-family: 'Inter', sans-serif;
                    page-break-after: always;
                    box-sizing: border-box;
                }

                .cover-page {
                    background-image: url('${coverUrl}');
                    background-size: cover;
                    background-position: center;
                }
                
                .cover-overlay {
                    position: absolute;
                    bottom: 80px;
                    left: 60px;
                    width: 80%;
                }

                .cover-title {
                    font-size: 54px;
                    font-weight: 800;
                    color: #0099FF;
                    text-transform: uppercase;
                    line-height: 1.1;
                    margin: 0;
                    text-shadow: 0 4px 10px rgba(0,0,0,0.8);
                }

                .page-header {
                    position: absolute;
                    top: 50px; left: 60px; right: 60px;
                    border-bottom: 1px solid #333;
                    padding-bottom: 10px;
                    color: #666;
                    font-size: 10px;
                    text-transform: uppercase;
                    display: flex; justify-content: space-between;
                }

                .page-content {
                    padding: 80px 60px 60px 60px;
                    height: 100%;
                    box-sizing: border-box;
                }

                .section-title {
                    font-size: 32px;
                    font-weight: 800;
                    color: #fff;
                    margin-bottom: 30px;
                }

                .page-footer {
                    position: absolute;
                    bottom: 30px; left: 60px; right: 60px;
                    border-top: 1px solid #333;
                    padding-top: 15px;
                    font-size: 10px; color: #666;
                    display: flex; justify-content: space-between;
                }

                /* Layout Classes */
                .ds-wrapper-single {
                    display: flex; flex-direction: column; gap: 30px;
                    height: 100%;
                }
                .ds-img-large {
                    width: 100%; height: 400px;
                    object-fit: contain;
                    background: #111;
                    padding: 10px;
                    border: 1px solid #333;
                }
                .ds-content-large h3 {
                    font-size: 24px; color: #fff; margin-bottom: 20px;
                }
                .ds-content-large p {
                    font-size: 14px; line-height: 1.6; color: #ccc;
                }
            </style>

            <!-- PAGE 1: COVER -->
            <div class="pdf-page cover-page">
                <div class="cover-overlay">
                    <h1 class="cover-title">${verticalName}</h1>
                </div>
            </div>

            <!-- PAGE 2: CONTEXT & VALUE (Restored Map Layout) -->
            <div class="pdf-page">
                <div class="page-header">
                    <span>CONTEXT & VALUE</span>
                    <span>2N</span>
                </div>
                <div class="page-content">
                    <h2 class="section-title">EL ESTÁNDAR 2N</h2>
                    
                    <div style="display: flex; gap: 40px; margin-bottom: 40px;">
                        <div style="flex: 1;">
                            <p style="font-size: 14px; line-height: 1.6; text-align: justify; margin-bottom: 20px;">
                                ${this.companyInfo.innovation}
                            </p>
                            <p style="font-size: 14px; line-height: 1.6; text-align: justify;">
                                Nuestro compromiso con la calidad y la innovación nos ha permitido ser un referente en el mercado global, ofreciendo soluciones que se adaptan a las necesidades de cada proyecto.
                            </p>
                        </div>
                        <div style="flex: 1; display: flex; align-items: center;">
                             <!-- Original Layout used world-map.svg -->
                             <img src="${worldMapUrl}" style="width: 100%; opacity: 0.8;">
                        </div>
                    </div>

                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                        <div style="background: #111; padding: 20px; border: 1px solid #333;">
                            <h4 style="color: #0099ff; margin-bottom: 10px;">Global Presence</h4>
                            <p style="font-size: 12px; color: #999;">Offices and distributors in major markets worldwide.</p>
                        </div>
                        <div style="background: #111; padding: 20px; border: 1px solid #333;">
                            <h4 style="color: #0099ff; margin-bottom: 10px;">Market Leader</h4>
                            <p style="font-size: 12px; color: #999;">#1 in IP Intercoms according to IHS Markit.</p>
                        </div>
                    </div>
                </div>
                <div class="page-footer">
                    <span>${verticalName}</span>
                    <span>2N Solutions</span>
                </div>
            </div>

            <!-- PAGE 3: INTRO (If exists) -->
             ${data.metadata?.introTitle ? `
            <div class="pdf-page">
                <div class="page-header">
                    <span>VISIÓN</span>
                    <span>2N</span>
                </div>
                <div class="page-content">
                    <h2 class="section-title">${data.metadata.introTitle.toUpperCase()}</h2>
                    <div style="font-size: 16px; line-height: 1.8; color: #ddd; white-space: pre-line;">
                        ${data.metadata.introText || ''}
                    </div>
                </div>
                <div class="page-footer">
                     <span>${verticalName}</span>
                    <span>2N Solutions</span>
                </div>
            </div>
            ` : ''}

            <!-- DYNAMIC SECTIONS -->
            ${this.renderDynamicPages(data.dynamicSections, verticalName)}

            <!-- PAGE FINAL: QUE APORTA 2N (Restored Building Layout) -->
            <div class="pdf-page">
                <div class="page-header">
                    <span class="page-header-text">VALOR DIFERENCIAL</span>
                </div>
                
                <!-- Background Map -->
                <div class="page-content" style="justify-content: flex-start; padding-top: 60px; background-image: url('${extractedMapUrl}'); background-size: cover; background-blend-mode: overlay; background-color: rgba(0,0,0,0.6);">
                    <h2 class="section-title">QUE APORTA 2N</h2>
                    
                    <div style="display: flex; gap: 30px; align-items: flex-start;">
                         <!-- Image Left (The Building) -->
                         <div style="flex: 0 0 50%;">
                            <img src="${buildingImgUrl}" style="width: 100%; height: auto; border-radius: 4px; border: 1px solid #333;">
                         </div>

                         <!-- Content Right -->
                         <div style="flex: 1;">
                            <p style="font-size: 12px; line-height: 1.6; color: #ccc; margin-bottom: 20px; text-align: justify; background: rgba(0,0,0,0.5); padding: 10px; border-radius: 4px;">
                                La seguridad física y la ciberseguridad deben ir de la mano. En 2N, garantizamos la protección de datos y comunicaciones frente a amenazas digitales.
                            </p>

                            <div style="margin-top: 0px; display: flex; flex-direction: column; gap: 10px;">
                                <div style="display: flex; align-items: center; gap: 10px;">
                                    <span style="color: #3b82f6; font-size: 12px;">●</span>
                                    <span style="color: #eee; font-size: 12px;"><strong>Cifrado extremo a extremo</strong></span>
                                </div>
                                <div style="display: flex; align-items: center; gap: 10px;">
                                    <span style="color: #3b82f6; font-size: 12px;">●</span>
                                    <span style="color: #eee; font-size: 12px;"><strong>Autenticación segura</strong></span>
                                </div>
                                <div style="display: flex; align-items: center; gap: 10px;">
                                    <span style="color: #3b82f6; font-size: 12px;">●</span>
                                    <span style="color: #eee; font-size: 12px;"><strong>Protección contra ataques</strong></span>
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

        // --- 4. PRELOAD & GENERATE ---
        const images = Array.from(container.querySelectorAll('img'));
        const bgDivs = Array.from(container.querySelectorAll('div'));
        const loadPromises = images.map(img => new Promise(r => {
            if (img.complete) r();
            img.onload = r;
            img.onerror = () => { console.warn('PDF Img Error', img.src); r(); };
        }));

        bgDivs.forEach(div => {
            const bg = window.getComputedStyle(div).backgroundImage;
            if (bg && bg !== 'none' && bg.startsWith('url')) {
                const url = bg.replace(/^url\(["']?/, '').replace(/["']?\)$/, '');
                const img = new Image();
                img.crossOrigin = "Anonymous";
                img.src = url;
                loadPromises.push(new Promise(r => {
                    img.onload = r;
                    img.onerror = () => { console.warn('PDF BG Error', url); r(); };
                }));
            }
        });

        await Promise.all(loadPromises);
        await new Promise(resolve => setTimeout(resolve, 1000));

        const opt = {
            margin: 0,
            filename: `2N_Dossier_${verticalName.replace(/\s+/g, '_')}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: {
                scale: 2,
                useCORS: true,
                allowTaint: false, // MANDATORY FALSE
                scrollY: 0,
                windowWidth: 794,
                width: 794
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
        const itemsPerPage = 1;
        for (let i = 0; i < sections.length; i += itemsPerPage) {
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
                                <div style="color: #ccc; font-size: 14px; line-height: 1.6;">${section.text}</div>
                            </div>
                        </div>
                    </div>
                    <div class="page-footer">
                        <span>${verticalName}</span>
                         <span>2N Solutions</span>
                    </div>
                </div>
            `;
        }
        return html;
    }
}

export const pdfService = new PDFService();
