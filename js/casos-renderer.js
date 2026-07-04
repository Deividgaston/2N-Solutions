import { contentService } from './services/content.service.js?v=4';

class CasosRenderer {
    constructor() {
        this.grid = document.getElementById('casosGrid');
        this.filterBtns = document.querySelectorAll('.filter-btn');
        this.allCases = [];
        this.filteredCases = [];
        
        this.init();
    }

    async init() {
        // Show loading state
        this.grid.innerHTML = '<div style="color:var(--text-muted); padding: 50px; text-align:center; grid-column: 1/-1;"><i class="fa-solid fa-spinner fa-spin"></i> Cargando proyectos reales...</div>';
        
        try {
            await this.loadData();
            this.bindFilters();
            this.render();
        } catch (error) {
            console.error('Error in CasosRenderer:', error);
            this.grid.innerHTML = '<div style="color:var(--danger); padding: 50px; text-align:center; grid-column: 1/-1;">Error al cargar los casos de éxito.</div>';
        }
    }

    async loadData() {
        this.allCases = await contentService.getAllGlobalCases();
        this.filteredCases = this.allCases;
    }

    bindFilters() {
        this.filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                this.filterBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                const filter = btn.dataset.filter;
                if (filter === 'all') {
                    this.filteredCases = this.allCases;
                } else {
                    this.filteredCases = this.allCases.filter(c => 
                        (c.verticals || []).includes(filter)
                    );
                }
                this.render();
            });
        });
    }

    render() {
        this.grid.innerHTML = '';
        this.grid.className = 'casos-premium-grid'; // Aseguramos que use el grid premium
        
        if (this.filteredCases.length === 0) {
            this.grid.innerHTML = '<div style="color:var(--text-muted); padding: 50px; text-align:center; grid-column: 1/-1;">No hay casos para esta categoría.</div>';
            return;
        }

        this.filteredCases.forEach(c => {
            const card = document.createElement('div');
            card.className = 'caso-premium-card';
            card.dataset.id = c.id;
            
            const verticalMap = {
                'bts': 'RESIDENCIAL · BTS',
                'btr': 'RESIDENCIAL · BTR',
                'hotel': 'HOSPITALITY · HOTEL',
                'office': 'CORPORATIVO · OFICINAS',
                'security': 'SEGURIDAD · INFRAESTRUCTURA',
                'retail': 'COMERCIAL · RETAIL'
            };
            const badgeText = (c.verticals || []).map(v => verticalMap[v] || v.toUpperCase()).join(' / ');

            card.innerHTML = `
                <div class="caso-premium-photo">
                    ${c.imageUrl ? `<img src="${c.imageUrl}" alt="${c.name}" loading="lazy">` : `
                        <div class="caso-premium-photo-placeholder"><i class="fa-solid ${c.icon || 'fa-building'}"></i></div>
                    `}
                    <span class="caso-premium-vertical-badge">${badgeText}</span>
                </div>
                <div class="caso-premium-body">
                    <div class="caso-premium-name">${c.name}</div>
                    <div class="caso-premium-location"><i class="fa-solid fa-location-dot"></i> España</div>
                    <p class="caso-premium-description">${c.description || ''}</p>
                    <div class="caso-zigzag-tags">
                        ${(c.items || []).slice(0, 3).map(i => `<span class="caso-zigzag-tag-item">${i}</span>`).join('')}
                    </div>
                </div>
            `;
            
            card.addEventListener('click', () => this.openModal(c));
            this.grid.appendChild(card);
        });
    }

    openModal(c) {
        const modal = document.getElementById('modalOverlay');
        const photo = document.getElementById('modalPhoto');
        const badge = document.getElementById('modalBadge');
        const title = document.getElementById('modalTitle');
        const location = document.getElementById('modalLocation');
        const desc = document.getElementById('modalDesc');
        const specs = document.getElementById('modalSpecs');
        const tags = document.getElementById('modalTags');

        if (c.imageUrl) {
            photo.src = c.imageUrl;
            photo.style.display = 'block';
        } else {
            photo.style.display = 'none';
        }

        const verticalMap = {
            'bts': 'RESIDENCIAL · BTS',
            'btr': 'RESIDENCIAL · BTR',
            'hotel': 'HOSPITALITY · HOTEL',
            'office': 'CORPORATIVO · OFICINAS',
            'security': 'SEGURIDAD · INFRAESTRUCTURA',
            'retail': 'COMERCIAL · RETAIL'
        };
        
        badge.textContent = (c.verticals || []).map(v => verticalMap[v] || v.toUpperCase()).join(' / ');
        title.textContent = c.name;
        location.innerHTML = `<i class="fa-solid fa-location-dot"></i> España`;
        desc.textContent = c.description || '';
        
        specs.innerHTML = (c.items || []).map(s => `
            <div class="modal-spec-item"><i class="fa-solid fa-circle-dot"></i>${s}</div>
        `).join('');
        
        tags.innerHTML = (c.tags || []).map(t => `<span class="modal-tag">${t}</span>`).join('');

        modal.classList.add('active'); // Changed from 'open' to 'active' to match common modal style
        document.body.style.overflow = 'hidden';
    }
}

// Global scope for closing modal (linked to close buttons in HTML)
window.closeModal = () => {
    document.getElementById('modalOverlay').classList.remove('open');
    document.body.style.overflow = '';
};

window.closeModalOnOverlay = (e) => {
    if (e.target === document.getElementById('modalOverlay')) window.closeModal();
};

document.addEventListener('keydown', e => {
    if (e.key === 'Escape') window.closeModal();
});

document.addEventListener('DOMContentLoaded', () => {
    new CasosRenderer();
});
