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

        // --- 1. PREPARE DATA & ASSETS ---
        // Title Mapping
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

        // Firebase Assets
        const coverUrl = 'https://firebasestorage.googleapis.com/v0/b/nsoluciones-68554.firebasestorage.app/o/multimedia%2F2N%2F1769375753951_Portada.png?alt=media&token=2566ea37-c62e-4a62-a078-445ee34504c8';
        const innovationUrl = 'https://firebasestorage.googleapis.com/v0/b/nsoluciones-68554.firebasestorage.app/o/multimedia%2F2N%2F1769375754501_sobre_2n.png?alt=media&token=1b45b35a-1adf-4faa-bb2a-b64ea02d1a0e';
        const historyUrl = 'https://firebasestorage.googleapis.com/v0/b/nsoluciones-68554.firebasestorage.app/o/multimedia%2F2N%2F1769375752617_mapa_2n.png?alt=media&token=4b991682-1e43-4736-bf7e-e239cbe84d66';
        const why2nUrl = 'https://firebasestorage.googleapis.com/v0/b/nsoluciones-68554.firebasestorage.app/o/multimedia%2F2N%2F1769375753424_porque_2n.png?alt=media&token=34739ddd-45c7-49a4-ba5a-6b204d3e6f92';


        // --- 2. SETUP CONTAINER ---
        // Create a hidden but present container for PDF generation
        const container = document.createElement('div');
        container.id = 'pdf-generation-container';
        container.style.position = 'relative'; // KEEP RELATIVE to ensure height calculation works
        container.style.width = '794px'; // A4 Portrait Width
        container.style.minHeight = '1123px'; // A4 Portrait Height
        container.style.zIndex = '9998';
        container.style.display = 'block';
        container.style.backgroundColor = '#1a1a1a';
        container.style.color = '#fff';
        container.style.fontFamily = "'Inter', sans-serif";

        // Append to body early to load images
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

        // --- 3. BUILD CONTENT ---
        container.innerHTML = `
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;800&display=swap');
                
                :root { --2n-blue: #0099FF; --2n-bg: #000; --text-body: #ccc; }

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
                    font-size: 54px; /* Slightly smaller to fit long titles */
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

                .feature-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; margin-top: 40px; }
                .feature-card { background: #111; padding: 20px; border-radius: 8px; border: 1px solid #333; text-align: center; }
                .feature-card h4 { color: white; margin: 10px 0 5px; font-size: 14px; }
                .feature-card p { font-size: 11px; color: #999; margin: 0; }
                .feature-icon { color: #0099FF; font-size: 24px; margin-bottom: 10px; }
            </style>

            <!-- PAGE 1: COVER -->
            <div class="pdf-page cover-page">
                <div class="cover-overlay">
                    <h1 class="cover-title">${verticalName}</h1>
                </div>
            </div>

            <!-- PAGE 2: INNOVATION (Text Layout with History Map as Texture BG) -->
            <div class="pdf-page">
                <div class="page-header">
                    <span>PROPUESTA DE VALOR</span>
                    <span>2N</span>
                </div>
                <div class="page-content">
                    <h2 class="section-title">INNOVACIÓN EN NUESTRO ADN</h2>
                    
                    <div style="font-size: 14px; line-height: 1.6; text-align: justify; margin-bottom: 30px; color: #ddd;">
                        <p>${this.companyInfo.innovation}</p>
                    </div>

                    <!-- Image Block -->
                    <div style="background-image: url('${historyUrl}'); height: 350px; background-size: cover; background-position: center; border-radius: 8px; margin-bottom: 40px; border: 1px solid #333; position: relative;">
                        <div style="position: absolute; inset:0; background: linear-gradient(to bottom, transparent, rgba(0,0,0,0.8));"></div>
                    </div>

                    <div class="feature-grid">
                        <div class="feature-card">
                            <div class="feature-icon">★</div>
                            <h4>Calidad Premium</h4>
                            <p>Diseño y fabricación europea.</p>
                        </div>
                        <div class="feature-card">
                            <div class="feature-icon">💡</div>
                            <h4>I+D Constante</h4>
                            <p>14% de inversión en desarrollo.</p>
                        </div>
                        <div class="feature-card">
                            <div class="feature-icon">🌍</div>
                            <h4>Soporte Global</h4>
                            <p>Presencia en +100 países.</p>
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

             <!-- PAGE FINAL: POR QUE 2N -->
             <div class="pdf-page">
                <div class="page-header"><span>RESUMEN</span><span>2N</span></div>
                <div class="page-content" style="background-image: url('${why2nUrl}'); background-size: contain; background-repeat: no-repeat; background-position: center; height: 100%;">
                </div>
                <div class="page-footer">
                     <span>${verticalName}</span>
                    <span>2N Solutions</span>
                </div>
             </div>
        `;

        // --- 4. PRELOAD & GENERATE ---
        // Robust Preloader
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
                img.crossOrigin = "Anonymous"; // Try CORS
                img.src = url;
                loadPromises.push(new Promise(r => {
                    img.onload = r;
                    img.onerror = () => { console.warn('PDF BG Error', url); r(); };
                }));
            }
        });

        await Promise.all(loadPromises);
        // Small buffer to ensure rendering matches
        await new Promise(resolve => setTimeout(resolve, 800));

        const opt = {
            margin: 0,
            filename: `2N_Dossier_${verticalName.replace(/\s+/g, '_')}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: {
                scale: 2,
                useCORS: true,
                allowTaint: true,
                scrollY: 0,
                // Critical dimensions to prevent 0 height issues
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
        return sections.map(section => `
            <div class="pdf-page">
                <div class="page-header">
                    <span>${verticalName}</span>
                    <span>SOLUCIÓN</span>
                </div>
                <div class="page-content">
                    <h2 class="section-title">${section.title || 'Detalle'}</h2>
                    
                    <div style="display: flex; flex-direction: column; gap: 30px;">
                        ${section.imageUrl ? `
                            <div style="width: 100%; height: 350px; background: #111; display: flex; align-items: center; justify-content: center; border: 1px solid #333; overflow: hidden; border-radius: 4px;">
                                <img src="${section.imageUrl}" style="max-width: 100%; max-height: 100%; object-fit: contain;">
                            </div>
                        ` : ''}
                        
                        <div style="font-size: 14px; line-height: 1.6; color: #ccc;">
                            ${section.text || ''}
                        </div>
                    </div>
                </div>
                <div class="page-footer">
                    <span>${verticalName}</span>
                    <span>2N Solutions</span>
                </div>
            </div>
        `).join('');
    }
}

export const pdfService = new PDFService();
