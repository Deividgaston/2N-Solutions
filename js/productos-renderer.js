import { contentService } from './services/content.service.js?v=5';

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

            // Ajuste visual dinámico para productos que tienen mucho margen transparente en su PNG original
            let baseScale = '1';
            if (p.name.includes('Style') || p.name.includes('Indoor View') || p.name.includes('Indoor Compact')) {
                baseScale = '1.45'; // Escalar producto que de otra manera se vería muy pequeño
            }

            const imgHtml = p.imageUrl
                ? `<img src="${p.imageUrl}" alt="${p.name}" loading="lazy" class="product-img" style="--base-scale: ${baseScale};">`
                : `<i class="fa-solid fa-box-open" style="font-size:4rem;opacity:0.2;color:white;"></i>`;

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
                <div class="product-photo">${imgHtml}</div>
                <div class="product-body">
                    <span class="product-cat">${categoryMap[p.category] || p.category}</span>
                    <div class="product-name">${p.name}</div>
                    <p class="product-desc">${p.description || ''}</p>
                    
                    ${featuresHtml ? `<div class="product-specsheet">${featuresHtml}</div>` : ''}
                    
                    <div class="product-footer">
                        <span>Ver todos los detalles</span>
                        <i class="fa-solid fa-arrow-right"></i>
                    </div>
                </div>
            `;

            card.addEventListener('click', () => this.openDetails(p));
            this.grid.appendChild(card);
        });
    }

    openDetails(p) {
        const modalImageDiv = document.querySelector('.modal-image');

        modalImageDiv.innerHTML = p.imageUrl
            ? `<img src="${p.imageUrl}" alt="${p.name}" class="modal-product-img">`
            : '';

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

        this.modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new ProductosRenderer();
});
