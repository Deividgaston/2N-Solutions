import { contentService } from './services/content.service.js?v=5';

// Fotos normalizadas (media/productos/, sin fondo y del mismo tamaño) y fichas técnicas en
// castellano (fichas/ o 2n.com), por nombre de producto. Si un producto no está aquí sigue
// con su imageUrl de Firestore. 'small' = IP Solo, que lleva más aire. Orden importa: lo más
// específico primero (Access Unit QR / M antes de Access Unit 2.0).
const FICHA_LOCAL = f => ({ href: 'fichas/2N_Ficha-tecnica_' + f + '_ES.pdf', local: true });
const MEDIA = [
    { re: /access unit qr/, img: 'pn_auqr' },
    { re: /access unit m\b/, img: 'pn_aum', ficha: { href: 'https://www.2n.com/es_ES/documents/22902/4202628/access-unit-m_datasheet_a4_es.pdf' } },
    { re: /access unit 2/, img: 'pn_au2', ficha: FICHA_LOCAL('Access-Unit-2.0') },
    { re: /commander box/, img: 'pn_acbox', ficha: { href: 'https://2n.com/en_GB/documents/22902/10543681/Access_commander_box_2_datasheet_es_lq.pdf/45a34707-1c4f-4638-93ad-c5df727e3ec5' } },
    { re: /ip style/, img: 'pn_ipstyle', ficha: FICHA_LOCAL('IP-Style') },
    { re: /ip verso/, img: 'pn_verso', ficha: FICHA_LOCAL('IP-Verso-2.0') },
    { re: /ip one/, img: 'pn_one', ficha: FICHA_LOCAL('IP-One') },
    { re: /ip solo/, small: true, ficha: FICHA_LOCAL('IP-Solo') },
    { re: /ip force/, img: 'pn_force', ficha: FICHA_LOCAL('IP-Force-2.0') },
    { re: /ip uni/, img: 'pn_uni', ficha: FICHA_LOCAL('IP-Uni') },
    { re: /ip safety/, img: 'pn_ipsafety', ficha: { href: 'https://www.2n.com/es_ES/documents/22902/1047456/ip_safety_leaflet_a4_es_lq.pdf/59b9dc41-f4a7-4de3-befa-a0ce094f5014' } },
    { re: /indoor view/, img: 'pn_view', ficha: FICHA_LOCAL('Indoor-View') },
    { re: /indoor compact/, img: 'pn_compact', ficha: { href: 'https://www.2n.com/es_ES/documents/22902/2040084/indoor_compact_leaflet_a4_es_lq.pdf/84d7ccb9-051a-42ce-97a4-86bd13cab533' } },
    { re: /indoor talk/, img: 'pn_talk' },
    { re: /\bclip\b/, img: 'pn_clip', ficha: { href: 'https://www.2n.com/es_ES/documents/22902/10305154/2N_Datasheet_Clip_ES_LQ.pdf/eb09027c-c040-4ea2-91c1-03136574123f' } },
    { re: /fortis cylinder/, img: 'pn_cyl', ficha: FICHA_LOCAL('Fortis-Cylinder') },
    { re: /fortis handle/, img: 'pn_handle', ficha: FICHA_LOCAL('Fortis-Handle') },
    { re: /mobile video/, img: 'pn_my2n', swap: true }
];

const escAttr = v => String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function mediaFor(name) {
    const n = String(name || '').toLowerCase().replace(/[®™]/g, '');
    const m = MEDIA.find(x => x.re.test(n)) || null;
    return m && { src: m.img ? 'media/productos/' + m.img + '.jpg' : null, small: !!m.small, swap: !!m.swap, ficha: m.ficha || null };
}

function fichaLink(m) {
    if (!m || !m.ficha) return '';
    const f = m.ficha;
    return '<a class="product-ficha" href="' + f.href + '"' + (f.local ? ' download' : ' target="_blank" rel="noopener"') + '>Ficha técnica en castellano <i class="fa-solid fa-arrow-down"></i></a>';
}

class ProductosRenderer {
    constructor() {
        this.grid = document.getElementById('productsGrid');
        this.filterBtns = document.querySelectorAll('.filter-btn');
        this.allProducts = [];
        this.filteredProducts = [];
        
        this.modal = document.getElementById('productModal');
        this.closeBtn = document.getElementById('closeModal');
        
        this.init();
    }

    async init() {
        this.grid.innerHTML = '<div style="color:var(--text-muted); padding: 50px; text-align:center; grid-column: 1/-1;"><i class="fa-solid fa-spinner fa-spin"></i> Cargando portfolio de productos...</div>';
        
        try {
            await this.loadData();
            this.bindFilters();
            this.bindModal();
            this.render();
        } catch (error) {
            console.error('Error in ProductosRenderer:', error);
            this.grid.innerHTML = '<div style="color:var(--danger); padding: 50px; text-align:center; grid-column: 1/-1;">Error al cargar los productos.</div>';
        }
    }

    async loadData() {
        this.allProducts = await contentService.getAllProducts();
        this.filteredProducts = this.allProducts;
    }

    bindFilters() {
        this.filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                this.filterBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const filter = btn.dataset.filter;
                this.filteredProducts = filter === 'all'
                    ? this.allProducts
                    : this.allProducts.filter(p => p.category === filter);
                this.render();
            });
        });
    }

    bindModal() {
        this.closeBtn.addEventListener('click', () => {
            this.modal.classList.remove('active');
            document.body.style.overflow = '';
        });
        this.modal.addEventListener('click', e => {
            if (e.target === this.modal) {
                this.modal.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    }

    // Foto de producto en contenedor cuadrado (contain + 10 % de aire; IP Solo 24 %).
    // Con foto normalizada: fondo claro. Con la imageUrl de Firestore: fondo oscuro de siempre.
    // Mobile Video alterna con fundido el reloj y su imageUrl (CSS; con movimiento reducido se queda en el reloj).
    // Nombre y URL vienen de Firestore y acaban en atributos dentro de innerHTML: se escapan.
    photoHtml(p, media, cls, lazy) {
        const loading = lazy ? ' loading="lazy"' : '';
        const name = escAttr(p.name);
        const url = escAttr(p.imageUrl);
        if (media && media.src) {
            const second = media.swap && p.imageUrl
                ? `<img src="${url}" alt="${name} en el móvil" class="product-img pimg-b"${loading}>`
                : '';
            const alt = media.swap ? `${name} en el reloj` : name;
            return `<div class="${cls} pstage light${second ? ' swap' : ''}"><img src="${media.src}" alt="${alt}" class="product-img"${loading}>${second}</div>`;
        }
        if (p.imageUrl) {
            return `<div class="${cls} pstage${media && media.small ? ' small' : ''}"><img src="${url}" alt="${name}" class="product-img"${loading}></div>`;
        }
        return `<div class="${cls} pstage"><i class="fa-solid fa-box-open"></i></div>`;
    }

    render() {
        this.grid.innerHTML = '';
        
        if (this.filteredProducts.length === 0) {
            this.grid.innerHTML = '<div style="color:var(--text-muted); padding: 50px; text-align:center; grid-column: 1/-1;">No hay productos en esta categoría.</div>';
            return;
        }

        const categoryMap = {
            'intercom': 'Intercomunicadores IP',
            'access': 'Control de Acceso',
            'indoor': 'Unidades Interiores',
            'software': 'Software y Aplicaciones'
        };

        this.filteredProducts.forEach(p => {
            const card = document.createElement('div');
            card.className = 'product-card';

            const media = mediaFor(p.name);

            // Mini HOJA TÉCNICA: specs {label, value} de la BD; si no hay, los tags
            let featuresHtml = '';
            const specs = (p.specs || []).filter(sp => sp && (sp.label || sp.value)).slice(0, 4);
            if (specs.length > 0) {
                featuresHtml = specs.map(sp => `
                    <div class="spec-row">
                        <span class="spec-label">${sp.label || ''}</span>
                        <span class="spec-value">${sp.value || ''}</span>
                    </div>`).join('');
            } else if (p.tags && p.tags.length > 0) {
                featuresHtml = p.tags.slice(0, 4).map(tag => `
                    <div class="spec-row">
                        <span class="spec-label"><i class="fa-solid fa-check"></i></span>
                        <span class="spec-value">${tag}</span>
                    </div>`).join('');
            }

            card.innerHTML = `
                ${this.photoHtml(p, media, 'product-photo', true)}
                <div class="product-body">
                    <span class="product-cat">${categoryMap[p.category] || p.category}</span>
                    <div class="product-name">${p.name}</div>
                    <p class="product-desc">${p.description || ''}</p>
                    
                    ${featuresHtml ? `<div class="product-specsheet">${featuresHtml}</div>` : ''}
                    ${fichaLink(media)}

                    <div class="product-footer">
                        <span>Ver todos los detalles</span>
                        <i class="fa-solid fa-arrow-right"></i>
                    </div>
                </div>
            `;

            // El enlace a la ficha descarga el PDF sin abrir el detalle
            const ficha = card.querySelector('.product-ficha');
            if (ficha) ficha.addEventListener('click', e => e.stopPropagation());
            card.addEventListener('click', () => this.openDetails(p));
            this.grid.appendChild(card);
        });
    }

    openDetails(p) {
        const modalImageDiv = document.querySelector('.modal-image');

        const media = mediaFor(p.name);

        modalImageDiv.innerHTML = this.photoHtml(p, media, 'modal-stage', false);

        document.getElementById('modalCat').textContent = (p.category || '').toUpperCase();
        document.getElementById('modalName').textContent = p.name;
        document.getElementById('modalDesc').textContent = p.description || '';
        
        // 1. Mostrar la "Lista Rápida" (Viñeta) al principio del interior
        const modalFeaturesWrapper = document.getElementById('modalFeaturesWrapper');
        const modalFeaturesList = document.getElementById('modalFeaturesList');
        
        if (p.tags && p.tags.length > 0) {
            modalFeaturesList.innerHTML = p.tags.map(tag => `<li><i class="fa-solid fa-check"></i> <div>${tag}</div></li>`).join('');
            modalFeaturesWrapper.style.display = 'block';
        } else {
            modalFeaturesWrapper.style.display = 'none';
        }

        // 2. Mostrar "Características Detalladas" debajo
        const specsContainer = document.getElementById('modalSpecs');
        if (p.specs && p.specs.length > 0) {
            specsContainer.innerHTML = p.specs.map(s => `
                <div style="padding: 10px; border-bottom: 1px solid rgba(255,255,255,0.05);">
                    <div style="font-size: 0.7rem; color: var(--primary-light); text-transform: uppercase; font-weight: 700;">${s.label}</div>
                    <div style="font-size: 0.95rem; color: white; margin-top:4px;">${s.value}</div>
                </div>
            `).join('');
            specsContainer.style.display = 'grid'; // Maintain grid styles from HTML
        } else {
            specsContainer.innerHTML = '';
            specsContainer.style.display = 'none';
        }

        // 3. Ocultar los tags píldora redundantes del final
        const tagsContainer = document.getElementById('modalTags');
        tagsContainer.innerHTML = '';

        // 4. Ficha técnica en castellano (si la hay)
        document.getElementById('modalFicha').innerHTML = fichaLink(media);

        this.modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new ProductosRenderer();
});
