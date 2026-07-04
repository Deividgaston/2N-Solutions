/**
 * 2N Presenter - PDF Generation Service
 * THE DISRUPTIVE ARCHITECTURAL ENGINE (v11.0 - HYPER-STABLE)
 * Fixes: Blank 1st page, 3KB empty files, truncation, and centering.
 */

class PDFService {
    constructor() {
        this.config = {
            blue: '#2563eb',
            black: '#0a0a0a'
        };
    }

    async generateDossier(verticalName, data) {
        console.count("PDF_ENGINE_V11_START");
        if (typeof html2pdf === 'undefined') return alert('Error: Dependencia html2pdf no detectada.');

        const curtain = this.showLoading();
        const title = (verticalName || '2N').toUpperCase();
        const hook = this.getHook(verticalName);
        const fileName = `Dossier_2N_${title.replace(/\s+/g, '_')}.pdf`;

        // 1. Create a container that is IN-FLOW but pushed down
        // We use a unique ID to avoid cache/leaks
        const containerId = 'pdf-v11-render-vault';
        const existing = document.getElementById(containerId);
        if (existing) existing.remove();

        const renderer = document.createElement('div');
        renderer.id = containerId;
        
        // Use document height to place it way below anything visible
        const pageHeight = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight);
        renderer.style.cssText = `
            position: absolute;
            top: ${pageHeight + 500}px;
            left: 0;
            width: 210mm;
            background: #ffffff;
            z-index: -999;
            visibility: visible;
            opacity: 1;
            padding: 0;
            margin: 0;
        `;
        document.body.appendChild(renderer);

        renderer.innerHTML = this.buildHTML(title, hook, data);

        // 2. STABILITY OPTIONS
        const options = {
            margin: 0,
            filename: fileName,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { 
                scale: 2, 
                useCORS: true, 
                backgroundColor: '#ffffff',
                // IMPORTANT: windowWidth MUST be 794 (210mm) to match our content
                windowWidth: 794,
                // We REMOVE windowHeight to let it calculate full height automatically
                scrollX: 0,
                scrollY: 0,
                logging: true,
                onclone: (doc) => {
                    const el = doc.getElementById(containerId);
                    if (el) {
                        el.style.position = 'relative';
                        el.style.top = '0';
                        el.style.left = '0';
                        el.style.margin = '0 auto';
                    }
                }
            },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
            pagebreak: { mode: ['css', 'legacy'] }
        };

        try {
            await this.waitForResources(renderer);
            await new Promise(r => setTimeout(r, 1500)); // Layout settle time

            // Use the worker API for more control
            const worker = html2pdf().set(options).from(renderer);
            await worker.save();
            console.log("✅ PDF v11.0: Export Complete.");
        } catch (error) {
            console.error("PDF Engine v11.0 Error:", error);
            alert("Error en la generación del dossier. Verifique su conexión.");
        } finally {
            renderer.remove();
            curtain.remove();
        }
    }

    async waitForResources(el) {
        const imgs = Array.from(el.querySelectorAll('img'));
        const imgPromises = imgs.map(img => {
            if (img.complete) return Promise.resolve();
            return new Promise(r => { img.onload = r; img.onerror = r; });
        });
        const fontsPromise = document.fonts.ready;
        return Promise.all([...imgPromises, fontsPromise]);
    }

    showLoading() {
        const c = document.createElement('div');
        c.style.cssText = 'position:fixed; inset:0; background:#fff; z-index:10000; display:flex; flex-direction:column; align-items:center; justify-content:center; color:#000; font-family:sans-serif;';
        c.innerHTML = `
            <div style="font-weight:900; letter-spacing:10px; font-size:14px; margin-bottom:20px;">2N | ENGINE v11.0</div>
            <div style="width:160px; height:2px; background:#eee; position:relative; overflow:hidden;">
                <div style="position:absolute; inset:0; background:#2563eb; width:50%; animation: slide 1s infinite linear;"></div>
            </div>
            <p style="margin-top:20px; font-size:10px; color:#aaa; letter-spacing:2px;">OPTIMIZANDO RENDERIZADO MÉTRICO...</p>
            <style>@keyframes slide { from { left:-100%; } to { left:100%; } }</style>
        `;
        document.body.appendChild(c);
        return c;
    }

    getHook(v) {
        const h = (v || '').toLowerCase();
        if (h.includes('bts')) return "Aumenta el valor percibido del edificio y atrae al comprador premium.";
        return "Infraestructuras que definen el estatus tecnológico de un proyecto.";
    }

    buildHTML(title, hook, data) {
        const intro = (data.mainIntro && data.mainIntro.length > 0) ? data.mainIntro[0] : 'Transformando edificios en experiencias tecnológicas conectadas.';
        const benefits = (data.benefits && data.benefits.length > 0) ? data.benefits : ['Seguridad IP', 'Diseño de Vanguardia', 'Garantía 5 Estrellas'];

        return `
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
                
                #pdf-v11-render-vault * { box-sizing: border-box; -webkit-print-color-adjust: exact; margin: 0; padding: 0; }
                
                .p-page {
                    width: 210mm;
                    height: 296mm; 
                    background: #ffffff;
                    position: relative;
                    overflow: hidden;
                    font-family: 'Inter', sans-serif;
                    page-break-after: always;
                    display: block;
                }

                .bg-black { background: #000000 !important; color: #ffffff !important; }
                .text-blue { color: #2563eb !important; }
                
                /* PAGE CONTENT */
                .p-inner { padding: 30mm 20mm; height: 100%; position: relative; }
                
                .h-cover { font-size: 50pt; font-weight: 900; line-height: 0.9; margin-bottom: 10mm; }
                .p-hook { font-size: 18px; font-weight: 300; opacity: 0.8; line-height: 1.3; max-width: 140mm; }

                .h-title { font-size: 44pt; font-weight: 900; line-height: 1; margin-bottom: 15mm; }
                .lead-txt { font-size: 20pt; font-weight: 500; border-left: 6px solid #2563eb; padding-left: 10mm; margin-bottom: 20mm; color: #444; }
                
                .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 8mm; }
                .b-card { padding: 8mm; background: #f8fafc; border: 1px solid #eee; font-weight: 700; color: #2563eb; }

                .stat-box { border-top: 1px solid #eee; padding-top: 10mm; }
                .stat-val { font-size: 48pt; font-weight: 900; color: #2563eb; display: block; line-height: 1; }

                .f-img { width: 100%; height: 120mm; object-fit: cover; }
                .f-body { padding: 15mm 20mm; }
                .f-h3 { font-size: 30pt; font-weight: 900; margin-bottom: 10mm; }

                .p-num { position: absolute; bottom: 15mm; right: 20mm; font-size: 10px; font-weight: 900; opacity: 0.2; letter-spacing: 3px; }
            </style>

            <!-- PAG 1: COVER -->
            <div class="p-page bg-black">
                <div style="height: 60%; background: #000 url('${data.heroImageUrl || 'assets/pdf_cover.png'}') center center / cover no-repeat;"></div>
                <div class="p-inner" style="padding-top: 10mm;">
                    <img src="assets/2N_Logo_RGB_White.png" style="width: 45mm; margin-bottom: 15mm;">
                    <h1 class="h-cover">${title}</h1>
                    <p class="p-hook">${hook}</p>
                </div>
            </div>

            <!-- PAG 2: BRAND -->
            <div class="p-page">
                <div class="p-inner" style="color:#000;">
                    <h2 class="h-title">The Standard of<br><span class="text-blue">Excellence.</span></h2>
                    <div class="lead-txt">${intro}</div>
                    <p style="font-size: 13pt; line-height: 1.8; color: #666; max-width: 155mm; margin-bottom: 15mm;">
                        Fundada en 1991, 2N es el pionero mundial en portería IP. Como parte estratégica de <strong>Axis Communications</strong> y del <strong>Grupo Canon</strong>.
                    </p>
                    <div style="display: flex; gap: 20mm;">
                        <div class="stat-box">
                            <span class="stat-val">#1</span>
                            <span style="font-size:9pt; font-weight:800; letter-spacing:1px;">GLOBAL IP PROVIDER</span>
                        </div>
                        <div class="stat-box">
                            <span class="stat-val">5Y</span>
                            <span style="font-size:9pt; font-weight:800; letter-spacing:1px;">CERTIFIED WARRANTY</span>
                        </div>
                    </div>
                </div>
                <span class="p-num">STRATEGY 02</span>
            </div>

            <!-- PAG 3: BENEFITS & HARDWARE -->
            <div class="p-page">
                <div class="p-inner" style="color:#000;">
                    <h2 class="h-title">Ecosistema<br><span class="text-blue">Digital.</span></h2>
                    <div class="grid-2">
                        ${benefits.map(b => `<div class="b-card">• ${b}</div>`).join('')}
                    </div>
                    ${data.techCards && data.techCards.length > 0 ? `
                        <div style="margin-top: 20mm;">
                            <h3 style="font-size: 20pt; font-weight: 900; margin-bottom: 10mm;">Hardware de Precisión</h3>
                            <div class="grid-2">
                                ${data.techCards.slice(0, 4).map(c => `
                                    <div style="border-bottom: 1px solid #eee; padding-bottom: 5mm;">
                                        <div style="font-weight:900; font-size:12pt; margin-bottom:2mm;">${c.name}</div>
                                        <div style="font-size:10pt; color:#888;">${c.desc}</div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}
                </div>
                <span class="p-num">SPECIFICATIONS 03</span>
            </div>

            ${this.renderSync(data.dynamicSections)}

            <!-- FINAL PAGE -->
            <div class="p-page bg-black" style="display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center;">
                <img src="assets/2N_Logo_RGB_White.png" style="width: 60mm; margin-bottom: 25mm;">
                <h2 style="font-size: 32pt; font-weight: 900;">La seguridad es<br><span class="text-blue">un diseño premiado.</span></h2>
                <div style="width: 20mm; height: 1mm; background: #2563eb; margin: 15mm 0;"></div>
                <p class="text-blue" style="font-size: 11pt; font-weight: 900; letter-spacing: 5px;">WWW.2N.COM</p>
            </div>
        `;
    }

    renderSync(sec) {
        if (!sec || sec.length === 0) return '';
        return sec.map((s, i) => `
            <div class="p-page">
                ${s.imageUrl ? `<img src="${s.imageUrl}" class="f-img">` : ''}
                <div class="f-body" style="color:#000;">
                    <h3 class="f-h3">${s.title}</h3>
                    <div style="font-size: 16pt; line-height: 1.7; color: #555;">${s.text}</div>
                </div>
                <span class="p-num">APPENDIX 0${i+4}</span>
            </div>
        `).join('');
    }
}

export const pdfService = new PDFService();
