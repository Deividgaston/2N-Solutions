/**
 * 2N Presenter - PDF Generation Engine
 * THE GOD-MODE ENGINE (v19.3 - THE FINAL PIXEL-PARITY)
 * Using the user-uploaded logos image (?v=3) for absolute certainty.
 */

class PDFEngineV13 {
    async generateDossier(verticalName, data) {
        console.log("🔥 PDF Engine v19.3: FINAL PIXEL-PARITY...");
        const curtain = this.showLoading();
        const title = (verticalName || 'SOLUCIÓN 2N').toUpperCase();
        // Hook = subtítulo real de la vertical si existe; si no, los genéricos.
        const hook = (data && data.hook) || ((verticalName || '').toLowerCase().includes('bts') ?
            "Eleva el valor de venta. Garantiza la excelencia tecnológica." :
            "Sistemas de acceso que definen el estatus del proyecto.");

        try {
            await this.ensureLibraries();
            let jsPDFLib = window.jspdf ? (window.jspdf.jsPDF || window.jsPDF) : window.jsPDF;
            if (!jsPDFLib) throw new Error("jsPDF Missing");

            const pdf = new jsPDFLib('p', 'mm', 'a4');
            const rawPages = this.buildPages(title, hook, data);
            const pagesHTML = rawPages.filter(p => p && p.trim().length > 100);
            
            for (let i = 0; i < pagesHTML.length; i++) {
                const tempDiv = document.createElement('div');
                tempDiv.style.cssText = `
                    position: fixed; top: 0; left: -15000px;
                    width: 794px; height: 1123px;
                    background: #ffffff; overflow: hidden !important;
                    margin: 0 !important; padding: 0 !important;
                    z-index: -999; pointer-events: none;
                `;
                tempDiv.innerHTML = pagesHTML[i];
                document.body.appendChild(tempDiv);

                await this.waitForContent(tempDiv);

                const canvas = await html2canvas(tempDiv, {
                    scale: 2,
                    useCORS: true,
                    backgroundColor: '#ffffff',
                    width: 794,
                    height: 1123,
                    logging: false
                });

                const imgData = canvas.toDataURL('image/jpeg', 0.95);
                if (i > 0) pdf.addPage();
                pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297);
                tempDiv.remove();
            }

            pdf.save(`${title.replace(/[.,;:!?\s]+$/, '').replace(/\s+/g, '_')}.pdf`);

        } catch (e) {
            console.error(e);
            alert(`Error: ${e.message}`);
        } finally {
            curtain.remove();
        }
    }

    async ensureLibraries() {
        // Libs servidas en LOCAL (js/vendor): sin dependencia del CDN al hacer clic.
        if (typeof html2canvas === 'undefined') {
            await this.loadScript('js/vendor/html2canvas.min.js');
        }
        if (!window.jspdf && !window.jsPDF) {
            await this.loadScript('js/vendor/jspdf.umd.min.js');
        }
    }

    loadScript(url) {
        return new Promise((r, j) => {
            const s = document.createElement('script'); s.src = url; s.onload = r; s.onerror = j; document.head.appendChild(s);
        });
    }

    async waitForContent(el) {
        const imgs = Array.from(el.querySelectorAll('img'));
        await Promise.all(imgs.map(img => {
            if (img.complete) return Promise.resolve();
            return new Promise(r => { img.onload = r; img.onerror = r; });
        }));
        await new Promise(r => setTimeout(r, 1500));
    }

    showLoading() {
        const c = document.createElement('div');
        c.style.cssText = 'position:fixed; inset:0; background:#fff; z-index:99999; display:flex; flex-direction:column; align-items:center; justify-content:center;';
        c.innerHTML = `<div style="font-weight:900; color:#2563eb; letter-spacing:10px;">FINALIZANDO v19.3...</div>`;
        document.body.appendChild(c);
        return c;
    }

    buildPages(title, hook, data) {
        // Intro real de la vertical (recortada: la caja de la pág. 2 es fija).
        let introText = (data.mainIntroText || 'Desde 1991, 2N define el estándar de acceso premium. Nuestra arquitectura abierta se integra en los ecosistemas más exigentes del mundo.');
        if (introText.length > 240) introText = introText.slice(0, 237).replace(/\s+\S*$/, '') + '…';
        const benefits = data.benefits || [];
        const hero = data.heroImageUrl || 'assets/pdf_cover.png';

        const style = `
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
                * { margin:0; padding:0; box-sizing:border-box; font-family: 'Inter', sans-serif; }
                .p-page { width: 794px; height: 1123px; position:relative; overflow:hidden !important; background:#fff; color:#000; }
                .bg-d { background:#000 !important; color:#fff !important; }
                .blue { color:#2563eb !important; }
                .inner { padding: 90px 75px; height: 100%; position: relative; }
                
                .h1 { font-size: 44px; font-weight: 900; line-height: 1.2; margin-bottom: 30px; letter-spacing: -1.5px; color:#fff; word-break: break-word; }
                .hook { font-size: 20px; font-weight: 400; opacity: 0.9; line-height: 1.4; color:#fff; max-width: 650px; }

                .split { display: flex; height: 1123px; width: 794px; }
                .left { width: 440px; padding: 75px 60px; background: #fff; display: flex; flex-direction: column; justify-content: center; }
                .right { width: 354px; background: #000; color: #fff; padding: 75px 50px; display: flex; flex-direction: column; justify-content: space-between; }
                
                .l-box { border-left: 9px solid #2563eb; padding-left: 30px; font-size: 26px; font-weight: 900; margin-bottom: 35px; line-height: 1.25; color:#111; }

                .syn-hub { margin-top: 50px; border-top: 1px solid #eee; padding-top: 35px; }
                .syn-label { font-size: 11px; font-weight: 900; letter-spacing: 5px; color: #888; margin-bottom: 25px; text-transform: uppercase; }
                .final-img { 
                    width: 100%; 
                    display: block;
                }

                .metric { border-top: 1px solid rgba(255,255,255,0.1); padding-top: 35px; }
                .m-val { font-size: 58px; font-weight: 900; color: #2563eb; line-height: 1; margin-bottom: 5px; }
                .m-lab { font-size: 10px; font-weight: 800; letter-spacing: 3px; color:#fff; text-transform: uppercase; }

                .tech-h { font-size: 52px; font-weight: 900; line-height: 0.95; margin-bottom: 50px; text-transform: uppercase; letter-spacing: -2.5px; }
            </style>
        `;

        const pages = [];

        // 1. Portada
        pages.push(`${style}<div class="p-page bg-d">
            <div style="height: 62%; background: url('${hero}') center center / cover no-repeat;"></div>
            <div class="inner" style="padding-top: 45px;">
                <img src="assets/2N_Logo_RGB_White.png" style="width: 175px; margin-bottom: 45px;">
                <h1 class="h1">${title}</h1>
                <p class="hook">${hook}</p>
            </div>
        </div>`);

        // 2. Identidad (MOSAIC PREMIUM v20.0)
        pages.push(`${style}<div class="p-page">
            <div class="split">
                <div class="left" style="justify-content: flex-start; gap: 40px;">
                    <div>
                        <p class="p-tag">IDENTIDAD ÚNICA</p>
                        <h2 style="font-size: 48px; font-weight: 900; line-height: 0.95; margin-bottom: 30px; letter-spacing: -2px;">UN LEGADO<br><span class="blue">IMPECABLE.</span></h2>
                        <div class="l-box" style="font-size: 22px; margin-bottom: 20px;">${introText}</div>
                        <p style="font-size: 14px; color: #666; line-height: 1.6;">Nuestra arquitectura abierta garantiza que cada proyecto cuente con una base tecnológica sólida, escalable y preparada para el futuro.</p>
                    </div>
                    
                    <div class="syn-hub" style="margin-top: auto; border:none; padding-top:0;">
                        <div class="syn-label" style="margin-bottom: 15px; opacity:0.6;">PARTNERS ESTRATÉGICOS</div>
                        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 25px; display: flex; align-items: center; justify-content: center;">
                            <img src="assets/synergy_group.png?v=3" style="width: 100%; max-width: 280px; filter: contrast(1.1);">
                        </div>
                    </div>
                </div>
                <div class="right" style="padding: 60px 40px;">
                    <div style="display: flex; flex-direction: column; gap: 20px; height: 100%;">
                        <div style="background: rgba(37,99,235,0.1); border-left: 4px solid #2563eb; padding: 30px; border-radius: 4px;">
                            <div class="m-val" style="font-size: 65px;">#01</div>
                            <div class="m-lab" style="color:#2563eb;">LÍDER MUNDIAL EN IP</div>
                        </div>
                        <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1); padding: 30px; border-radius: 4px;">
                            <div class="m-val" style="color:#fff;">+30</div>
                            <div class="m-lab">AÑOS DE EXPERIENCIA</div>
                        </div>
                        <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1); padding: 30px; border-radius: 4px;">
                            <div class="m-val" style="color:#fff;">130</div>
                            <div class="m-lab">PAÍSES PRESENTES</div>
                        </div>
                        
                        <div style="margin-top: auto; background: #2563eb; padding: 30px; border-radius: 4px; color: #fff;">
                            <p style="font-size: 13px; font-weight: 700; line-height: 1.5;">Infraestructura blindada por la alianza tecnológica entre 2N, Axis y el Grupo Canon para proyectos de alto rendimiento.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>`);

        // 3. Tecnología
        pages.push(`${style}<div class="p-page">
            <div class="inner">
                <p style="font-size: 11px; font-weight: 900; letter-spacing: 5px; color: #2563eb; margin-bottom: 25px; text-transform: uppercase;">ECOSISTEMA DE VALOR</p>
                <h2 class="tech-h">TECNOLOGÍA <span class="blue">SIN CONCESIONES.</span></h2>
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 50px;">
                    ${benefits.slice(0,6).map(b => `<div style="padding: 25px; background: #f4f7f9; border: 1px solid #e1e9ef; font-weight: 900; color: #2563eb; text-align: center; font-size: 12px; border-radius: 4px;">${b}</div>`).join('')}
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px;">
                    <div style="border-top: 1px solid #eee; padding-top: 25px;"><div style="font-size: 18px; font-weight: 900; margin-bottom: 12px; text-transform: uppercase;">WaveKey (Móvil)</div><div style="font-size: 14.5px; color: #666; line-height: 1.6;">Eliminamos las llaves físicas. Acceso Bluetooth ultra-rápido con encriptación bancaria.</div></div>
                    <div style="border-top: 1px solid #eee; padding-top: 25px;"><div style="font-size: 18px; font-weight: 900; margin-bottom: 12px; text-transform: uppercase;">My2N</div><div style="font-size: 14.5px; color: #666; line-height: 1.6;">Gestión remota absoluta. Videollamadas smartphone con fiabilidad total del 99.9%.</div></div>
                    <div style="border-top: 1px solid #eee; padding-top: 25px;"><div style="font-size: 18px; font-weight: 900; margin-bottom: 12px; text-transform: uppercase;">Ciberseguridad</div><div style="font-size: 14.5px; color: #666; line-height: 1.6;">Protección de grado militar con protocolos HTTPS y 802.1x integrados nativamente.</div></div>
                    <div style="border-top: 1px solid #eee; padding-top: 25px;"><div style="font-size: 18px; font-weight: 900; margin-bottom: 12px; text-transform: uppercase;">Accesibilidad</div><div style="font-size: 14.5px; color: #666; line-height: 1.6;">Cumplimiento total de normativas inclusivas y certificación RED de la Unión Europea.</div></div>
                </div>
                <div style="background: #000; color: #fff; padding: 45px; border-radius: 4px; display: flex; align-items: center; justify-content: space-between; margin-top: 70px;">
                    <div style="font-weight: 900; letter-spacing: 3px; font-size: 17px;">ARQUITECTURA ABIERTA</div>
                    <div style="font-size: 13px; opacity: 0.7;">Integración total con SIP, ONVIF y sistemas PMS modernos.</div>
                </div>
            </div>
        </div>`);

        // DIN
        data.dynamicSections?.forEach((s) => {
            if (!s.title && !s.text) return;
            pages.push(`${style}<div class="p-page">
                ${s.imageUrl ? `<div style="height: 446px; width: 100%; background: #f0f0f0 url('${s.imageUrl}') center center / cover no-repeat; overflow: hidden;"></div>` : ''}
                <div class="inner" style="padding-top: 40px;">
                    <p style="font-size: 11px; font-weight: 900; letter-spacing: 5px; color: #2563eb; margin-bottom: 25px; text-transform: uppercase;">${(s.eyebrow || 'CASO DE ÉXITO').toUpperCase()}</p>
                    <h2 style="font-size: 45px; font-weight: 900; margin-bottom: 25px; letter-spacing: -2px;">${s.title}</h2>
                    <div style="font-size: 20px; line-height: 1.6; color: #444; font-weight: 300;">${s.text}</div>
                    <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-top: 30px;">
                        ${(s.tags || []).map(t => `<span style="background: rgba(37,99,235,0.08); color: #2563eb; padding: 4px 12px; border-radius: 4px; font-size: 11px; font-weight: 700;">${t}</span>`).join('')}
                    </div>
                </div>
            </div>`);
        });

        // DISPOSITIVOS RECOMENDADOS (2N PRODUCTS)
        if (data.techCards && data.techCards.length > 0) {
            let verticalNameSanitized = title.replace('DOSSIER 2N ', '').replace('SOLUCIÓN 2N ', '');
            
            for(let i=0; i<data.techCards.length; i+=6) {
                const chunk = data.techCards.slice(i, i+6);
                
                const cardsHtml = chunk.map(c => {
                    const categoryMap = { 'intercom': 'Intercomunicadores IP', 'access': 'Sistemas de Acceso', 'indoor': 'Unidades Interiores', 'software': 'Software', 'aux': 'Accesorios' };
                    const catName = categoryMap[c.category] || c.category || 'Dispositivo';
                    
                    return `
                    <div style="background:#f4f7f9; border:1px solid #e1e9ef; border-radius:6px; padding:20px; display:flex; flex-direction:column; align-items:flex-start; text-align:left; height:100%;">
                        <div style="height:110px; width:100%; display:flex; align-items:center; justify-content:center; margin-bottom:15px; background:#fff; border-radius:4px; padding:8px;">
                            ${c.imageUrl ? `<img src="${c.imageUrl}" style="max-height:100%; max-width:100%; object-fit:contain;">` : ''}
                        </div>
                        <div style="font-size:9px; font-weight:900; color:#2563eb; letter-spacing:1.5px; text-transform:uppercase; margin-bottom:5px;">${catName}</div>
                        <div style="font-size:16px; font-weight:900; color:#111; margin-bottom:10px; line-height:1.2;">${c.name}</div>
                        ${c.description ? `<div style="font-size:11px; color:#666; line-height:1.4; margin-bottom:10px;">${c.description.substring(0, 85)}...</div>` : ''}
                        <div style="display:flex; flex-wrap:wrap; gap:4px; margin-top:auto;">
                            ${(c.tags || []).slice(0,3).map(t => `<span style="background:rgba(37,99,235,0.1); color:#2563eb; padding:3px 8px; border-radius:3px; font-size:9px; font-weight:700;">${t}</span>`).join('')}
                        </div>
                    </div>
                `}).join('');

                pages.push(`${style}<div class="p-page">
                    <div class="inner" style="background:#fff;">
                        <p style="font-size:11px; font-weight:900; letter-spacing:5px; color:#2563eb; margin-bottom:25px; text-transform:uppercase;">PORTFOLIO TECNOLÓGICO</p>
                        <h2 style="font-size:36px; font-weight:900; line-height:1.05; margin-bottom:40px; letter-spacing:-1.5px; text-transform:uppercase;">${data.techTitle || `DISPOSITIVOS RECOMENDADOS PARA ${verticalNameSanitized}`}</h2>
                        <div style="display:grid; grid-template-columns:repeat(2, 1fr); gap:20px; align-content:start;">
                            ${cardsHtml}
                        </div>
                    </div>
                </div>`);
            }
        }

        // CASOS DE ÉXITO GLOBALES
        if (data.cases && data.cases.length > 0) {
            for(let i=0; i<data.cases.length; i+=4) {
                const chunk = data.cases.slice(i, i+4);
                
                const casesHtml = chunk.map(c => `
                    <div style="display:flex; border:1px solid #e1e9ef; border-radius:6px; background:#fff; overflow:hidden; height:170px;">
                        <div style="width:35%; background: #000 url('${c.imageUrl || 'assets/placeholder-case.jpg'}') center center/cover;"></div>
                        <div style="width:65%; padding:20px 25px; display:flex; flex-direction:column; justify-content:center;">
                            <div style="font-size:9px; font-weight:900; color:#2563eb; letter-spacing:1.5px; text-transform:uppercase; margin-bottom:8px;">PROYECTO DE REFERENCIA</div>
                            <div style="font-size:20px; font-weight:900; color:#111; margin-bottom:10px; line-height:1.1;">${c.name}</div>
                            <div style="font-size:12px; color:#666; line-height:1.5; margin-bottom:12px; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;">${c.description || ''}</div>
                            <div style="font-size:10px; color:#444;">
                                ${(c.items || []).slice(0,3).map(item => `<div style="margin-bottom:3px; display:flex; gap:6px;"><span style="color:#2563eb;">•</span> ${item}</div>`).join('')}
                            </div>
                        </div>
                    </div>
                `).join('');

                pages.push(`${style}<div class="p-page">
                    <div class="inner" style="background:#f9fafb;">
                         <p style="font-size:11px; font-weight:900; letter-spacing:5px; color:#2563eb; margin-bottom:25px; text-transform:uppercase;">PROYECTOS INTERNACIONALES</p>
                         <h2 style="font-size:36px; font-weight:900; line-height:1.05; margin-bottom:40px; letter-spacing:-1.5px; text-transform:uppercase;">${data.casesTitle || 'CASOS DE ÉXITO 2N'}</h2>
                         <div style="display:flex; flex-direction:column; gap:20px;">
                            ${casesHtml}
                         </div>
                    </div>
                </div>`);
            }
        }

        // CIERRE
        pages.push(`${style}<div class="p-page bg-d" style="display:flex; flex-direction:column; justify-content:center; align-items:center;">
            <img src="assets/2N_Logo_RGB_White.png" style="width: 230px; margin-bottom: 60px;">
            <p class="blue" style="font-weight:900; letter-spacing:15px; font-size: 20px;">WWW.2N.COM/ES</p>
        </div>`);

        const footerHtml = `
            <div style="position:absolute; bottom:55px; left:75px; right:75px; display:flex; justify-content:space-between; align-items:center; border-top:1px solid #eaeaea; padding-top:20px; font-size:10px; font-weight:800; color:#888; text-transform:uppercase; letter-spacing:2px; z-index:100;">
                <div style="display:flex; align-items:center; gap:8px;">
                    <img src="assets/2N_Logo_RGB_Blue.png" style="height:12px; margin-top:-2px;" onerror="this.style.display='none'">
                    <span>2N TELEKOMUNIKACE a.s.</span>
                </div>
                <div>www.2n.com/es</div>
            </div>
        `;

        return pages.map((page, index) => {
            if (index >= 2 && index < pages.length - 1) {
                // Insert footer just before the last </div>
                const lastDivIndex = page.lastIndexOf('</div>');
                if (lastDivIndex !== -1) {
                    return page.substring(0, lastDivIndex) + footerHtml + '</div>';
                }
            }
            return page;
        });
    }
}

export const pdfGodEngine = new PDFEngineV13();
