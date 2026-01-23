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
        const container = document.createElement('div');
        container.id = 'pdf-generation-container';
        // Strategy: Place ON TOP to ensure rendering, but cover with a curtain
        container.style.position = 'fixed';
        container.style.top = '0';
        container.style.left = '0';
        container.style.width = '800px'; // Fixed A4 width context
        container.style.minHeight = '1123px'; // FORCE A4 HEIGHT to prevent 0-height render
        container.style.zIndex = '9998'; // High Z-index
        container.style.opacity = '1';
        container.style.backgroundColor = '#ffffff'; // Force white background
        container.style.color = '#000'; // Force black text
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
        // SIMPLIFIED DEBUG CONTENT - REMOVE IMAGES TO TEST ENGINE
        container.innerHTML = `
            <div style="padding: 50px; background: white; color: black; width: 100%; height: 100%;">
                <h1 style="color: red; font-size: 40px;">TEST DE PDF</h1>
                <p>Si ves esto, el sistema de generación funciona.</p>
                <p>El problema anterior era probablemente una imagen corrupta o un estilo CSS complejo.</p>
                <hr>
                <p>Vertical: ${verticalName}</p>
            </div>
        `;

        /* 
        // ORIGINAL COMPLEX CONTENT COMMENTED OUT
        container.innerHTML = `
            ... (omitted for debug) ...
        `;
        */

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
                logging: true,
                backgroundColor: '#000',
                useCORS: true,
                allowTaint: false, // CRITICAL: Must be false to allow data export
                scrollY: 0,
                windowWidth: 1200,
                windowHeight: 2000
            },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        try {
            // Generate PDF
            // Generate PDF - DEBUG MODE
            // Instead of saving, we check if the canvas renders correctly
            const worker = html2pdf().set(opt).from(container);

            worker.toCanvas().then((canvas) => {
                // FORCE DISPLAY CANVAS ON SCREEN
                canvas.style.position = 'fixed';
                canvas.style.top = '50px';
                canvas.style.left = '50px';
                canvas.style.zIndex = '10000';
                canvas.style.border = '10px solid red';
                canvas.style.maxWidth = '90%';
                canvas.style.height = 'auto';
                document.body.appendChild(canvas);

                alert('MODO DEPURACIÓN: He generado una "foto" del PDF y la he puesto en pantalla con borde ROJO. \n\n¿Ves el contenido dentro del borde rojo?\n\n(Si lo ves, el problema es al guardar el archivo. Si está negro/blanco, el problema es el renderizado).');
            });
            // await worker.save(); // DISABLED FOR DEBUG
        } catch (error) {
            console.error('PDF Generation error:', error);
            alert(`Error al generar el PDF: ${error.message || error}`);
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
