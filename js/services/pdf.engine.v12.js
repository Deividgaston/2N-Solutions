/**
 * 2N Presenter - PDF Generation Engine
 * THE DISRUPTIVE ARCHITECTURAL ENGINE (v12.0 - Absolute Cache Bypass)
 * Fixed: Blank pages by creating a dedicated new file to bypass browser caching.
 */

class PDFEngineV12 {
    constructor() {}

    async generateDossier(verticalName, data) {
        console.log("💎 PDF Engine v12.0: Initializing...");
        if (typeof html2pdf === 'undefined') return alert('Error: html2pdf bundle no cargado.');

        const curtain = this.showLoading();
        const title = (verticalName || '2N SOLUTION').toUpperCase();
        const hook = this.getHook(verticalName);
        const fileName = `Dossier_2N_${title.replace(/\s+/g, '_')}_v12.pdf`;

        // 1. Create a FRESH container in the DOM
        const uniqueId = 'renderer-v12-' + Date.now();
        const renderer = document.createElement('div');
        renderer.id = uniqueId;
        
        // We place it at the VERY TOP of the page but absolutely positioned
        // To ensure it's in the "visible" coordinate space for the capture worker
        renderer.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 210mm;
            background: #ffffff;
            z-index: -9999;
            visibility: visible;
            opacity: 1;
            transform: translateZ(0); /* Force GPU paint */
        `;
        document.body.appendChild(renderer);

        renderer.innerHTML = this.buildHTML(title, hook, data);

        // 2. CONFIGURACIÓN DE ALTA ESTABILIDAD
        const opt = {
            margin: 0,
            filename: fileName,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { 
                scale: 2, 
                useCORS: true, 
                backgroundColor: '#ffffff',
                width: 794,
                windowWidth: 794,
                // We REMOVE scroll constraints to let html2pdf handle its own temporary clone
                logging: true,
                onclone: (doc) => {
                    // This is the CRITICAL STEP: Ensure the cloned element is at the top of the virtual doc
                    const clone = doc.getElementById(uniqueId);
                    if (clone) {
                        clone.style.position = 'relative';
                        clone.style.top = '0';
                        clone.style.left = '0';
                        clone.style.zIndex = '1';
                        // Remove everything else in the clone to avoid noise
                        Array.from(doc.body.children).forEach(child => {
                            if (child.id !== uniqueId) child.style.display = 'none';
                        });
                    }
                }
            },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
            pagebreak: { mode: ['css', 'legacy'] }
        };

        try {
            // Wait for full load
            await this.waitForContent(renderer);
            await new Promise(r => setTimeout(r, 2000));
            
            // Execute the PDF sequence
            await html2pdf().set(opt).from(renderer).save();
            console.log("✅ PDF v12.0: Success.");
        } catch (err) {
            console.error("PDF v12.0 Error:", err);
            alert("Error al generar el dossier v12.");
        } finally {
            renderer.remove();
            curtain.remove();
        }
    }

    async waitForContent(container) {
        const imgs = Array.from(container.querySelectorAll('img'));
        const promises = imgs.map(img => {
            if (img.complete) return Promise.resolve();
            return new Promise(r => { 
                img.onload = r; 
                img.onerror = () => {
                    console.warn("Failed to load image in PDF:", img.src);
                    r(); 
                };
            });
        });
        await Promise.all(promises);
        if (document.fonts) await document.fonts.ready;
    }

    showLoading() {
        const c = document.createElement('div');
        c.style.cssText = 'position:fixed; inset:0; background:#fff; z-index:20000; display:flex; flex-direction:column; align-items:center; justify-content:center; color:#000; font-family:sans-serif;';
        c.innerHTML = `
            <div style="font-weight:900; letter-spacing:10px; font-size:16px; margin-bottom:20px;">2N | HYPER-ENGINE v12</div>
            <div style="width:200px; height:3px; background:#f0f0f0; position:relative; overflow:hidden; border-radius:10px;">
                <div style="position:absolute; inset:0; background:#2563eb; width:50%; animation: move 1.2s infinite ease-in-out;"></div>
            </div>
            <p style="margin-top:20px; font-size:10px; color:#666; letter-spacing:3px; text-transform:uppercase;">Forzando renderizado síncrono...</p>
            <style>@keyframes move { from { transform:translateX(-100%); } to { transform:translateX(200%); } }</style>
        `;
        document.body.appendChild(c);
        return c;
    }

    getHook(v) {
        const low = (v || '').toLowerCase();
        if (low.includes('bts')) return "Viviendas que aceleran el cierre de ventas y elevan el valor percibido.";
        return "Sistemas de acceso que definen el estatus tecnológico del proyecto.";
    }

    buildHTML(title, hook, data) {
        const intro = (data.mainIntro && data.mainIntro.length > 0) ? data.mainIntro[0] : 'Transformando edificios en experiencias tecnológicas conectadas.';
        const benefits = (data.benefits && data.benefits.length > 0) ? data.benefits : ['Seguridad IP', 'Diseño Premiado', 'Garantía 5 Estrellas'];

        return `
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
                [id^="renderer-v12"] * { box-sizing: border-box; -webkit-print-color-adjust: exact; margin: 0; padding: 0; }
                
                .page {
                    width: 210mm;
                    height: 296.5mm; 
                    background: #ffffff;
                    position: relative;
                    overflow: hidden;
                    font-family: 'Inter', sans-serif;
                    page-break-after: always;
                }

                .dark { background: #000000 !important; color: #ffffff !important; }
                .blue { color: #2563eb !important; }
                
                .inner { padding: 30mm 20mm; height: 100%; position: relative; }
                
                .h-capa { font-size: 50pt; font-weight: 900; line-height: 0.9; letter-spacing: -4px; margin-bottom: 12mm; }
                .h-hook { font-size: 18pt; font-weight: 300; opacity: 0.8; line-height: 1.2; }

                .h-arch { font-size: 42pt; font-weight: 900; line-height: 1; letter-spacing: -2px; margin-bottom: 15mm; }
                .l-box { font-size: 19pt; font-weight: 500; border-left: 6px solid #2563eb; padding-left: 10mm; margin-bottom: 20mm; color: #333; line-height: 1.4; }
                
                .g-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8mm; }
                .b-item { padding: 8mm; background: #f8fafc; border: 1px solid #eee; font-weight: 700; color: #2563eb; font-size: 13pt; border-radius: 4px; }

                .t-img { width: 100%; height: 125mm; object-fit: cover; }
                .t-box { padding: 15mm 20mm; color: #000; }
                .t-h3 { font-size: 32pt; font-weight: 900; margin-bottom: 8mm; }

                .foot { position: absolute; bottom: 12mm; left: 20mm; font-size: 9pt; font-weight: 900; opacity: 0.15; letter-spacing: 4px; }
            </style>

            <div class="page dark">
                <div style="height: 62%; background: #000 url('${data.heroImageUrl || 'assets/pdf_cover.png'}') center center / cover no-repeat;"></div>
                <div class="inner" style="padding-top: 15mm;">
                    <img src="assets/2N_Logo_RGB_White.png" style="width: 45mm; margin-bottom: 15mm;">
                    <h1 class="h-capa">${title}</h1>
                    <p class="h-hook">${hook}</p>
                </div>
            </div>

            <div class="page">
                <div class="inner" style="color: #000;">
                    <h2 class="h-arch">The Standard of<br><span class="blue">Excellence.</span></h2>
                    <div class="l-box">${intro}</div>
                    <p style="font-size: 13pt; line-height: 1.8; color: #666; max-width: 150mm; margin-bottom: 20mm;">
                        Fundada en 1991, 2N es el líder mundial en intercomunicadores IP. Como socios estratégicos de <strong>Axis Communications</strong> y parte del <strong>Grupo Canon</strong>, definimos el futuro del acceso inteligente.
                    </p>
                    <div style="display: flex; gap: 30mm;">
                        <div><span class="blue" style="font-size: 44pt; font-weight: 900; display: block; line-height: 1;">#1</span><span style="font-size: 9pt; font-weight: 800; letter-spacing: 2px;">GLOBAL IP LEADER</span></div>
                        <div><span class="blue" style="font-size: 44pt; font-weight: 900; display: block; line-height: 1;">5Y</span><span style="font-size: 9pt; font-weight: 800; letter-spacing: 2px;">REAL WARRANTY</span></div>
                    </div>
                </div>
                <div class="foot">ARCHITECTURAL DOSSIER 02</div>
            </div>

            <div class="page">
                <div class="inner" style="color: #000;">
                    <h2 class="h-arch">Ecosistema<br><span class="blue">Inteligente.</span></h2>
                    <div class="g-grid">
                        ${benefits.map(b => `<div class="b-item">• ${b}</div>`).join('')}
                    </div>
                    ${data.techCards && data.techCards.length > 0 ? `
                        <div style="margin-top: 22mm;">
                            <h3 style="font-size: 20pt; font-weight: 900; margin-bottom: 10mm;">Hardware de Precisión</h3>
                            <div class="g-grid">
                                ${data.techCards.slice(0, 4).map(c => `
                                    <div style="border-bottom: 1px solid #eee; padding-bottom: 6mm;">
                                        <div style="font-weight: 900; font-size: 13pt; margin-bottom: 3mm;">${c.name}</div>
                                        <div style="font-size: 10pt; color: #777;">${c.desc}</div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}
                </div>
                <div class="foot">TECHNICAL SPECS 03</div>
            </div>

            ${data.dynamicSections && data.dynamicSections.map((s, i) => `
                <div class="page">
                    ${s.imageUrl ? `<img src="${s.imageUrl}" class="t-img">` : ''}
                    <div class="t-box">
                        <h3 class="t-h3">${s.title}</h3>
                        <div style="font-size: 15pt; line-height: 1.8; color: #555;">${s.text}</div>
                    </div>
                    <div class="foot">ANNEX TÉCNICO 0${i+4}</div>
                </div>
            `).join('')}

            <div class="page dark" style="display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center;">
                <img src="assets/2N_Logo_RGB_White.png" style="width: 70mm; margin-bottom: 25mm;">
                <h2 style="font-size: 34pt; font-weight: 900;">La seguridad es<br><span class="blue">un diseño premiado.</span></h2>
                <div style="width: 25mm; height: 1.5mm; background: #2563eb; margin: 20mm 0; border-radius: 10px;"></div>
                <p class="blue" style="font-size: 12pt; font-weight: 900; letter-spacing: 7px;">WWW.2N.COM</p>
            </div>
        `;
    }
}

export const pdfEngine = new PDFEngineV12();
