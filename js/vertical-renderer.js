
/**
 * 2N Presenter - Vertical Renderer
 * Fetches and renders dynamic content sections for vertical landing pages.
 */

import { contentService } from './services/content.service.js';

class VerticalRenderer {
    constructor() {
        this.dynamicContainer = document.getElementById('dynamic-sections-container');
        this.staticShowcase = document.querySelector('.feature-showcase');
        
        // Priority: use dynamicContainer if it exists, otherwise use staticShowcase
        this.container = this.dynamicContainer || this.staticShowcase;
        this.verticalId = document.body.dataset.vertical || document.querySelector('[data-vertical]')?.dataset.vertical;

        if (this.container && this.verticalId) {
            this.init();
        } else {
            console.warn('VerticalRenderer: Missing container or data-vertical attribute.');
        }
    }

    async init() {
        // Visual Debugging
        if (this.container) {
            this.container.innerHTML = '<div style="padding: 20px; text-align: center; color: #888;" class="debug-loader"><i class="fa-solid fa-spinner fa-spin"></i> Cargando contenidos dinámicos...</div>';
        }

        try {
            console.log('VerticalRenderer: Fetching for', this.verticalId);

            // Parallel fetch: Sections + Intro Meta + Tech Cards + Cases
            const [sections, meta, techCards, cases] = await Promise.all([
                contentService.getSections(this.verticalId),
                contentService.getVerticalMeta(this.verticalId),
                contentService.getGlobalProductsByVertical(this.verticalId), // Pull global recommended products instead of legacy isolated cards
                contentService.getGlobalCasesByVertical(this.verticalId)
            ]);

            console.log('VerticalRenderer: Data received', { sections: sections?.length, meta, techCards: techCards?.length, cases: cases?.length });

            // Clear loader from fallback container
            if (this.container) this.container.innerHTML = '';

            this.renderIntro(meta);
            this.updateSEO(meta);
            this.renderSections(sections);
            this.renderTechCards(techCards);
            this.renderCases(cases);
            this.initScrollAnimations();

        } catch (error) {
            console.error('Error loading content:', error);
            if (this.container) {
                this.container.innerHTML = `<div style="padding: 20px; color: #ff4444; border: 1px solid #ff4444; border-radius: 8px;">Error cargando contenido: ${error.message}<br>Intenta recargar la página.</div>`;
            }
        }
    }

    renderIntro(meta) {
        if (!meta) return;

        this.renderHero(meta);

        // Title
        if (meta.introTitle) {
            const titleEl = document.querySelector('.intro-text h2') || document.querySelector('.content-main h2');
            if (titleEl) titleEl.textContent = meta.introTitle;
        }

        // Subtitle
        if (meta.introSubtitle) {
            const titleEl = document.querySelector('.intro-text h2') || document.querySelector('.content-main h2');
            if (titleEl) {
                let subtitleEl = document.querySelector('.intro-subtitle');
                if (!subtitleEl) {
                    subtitleEl = document.createElement('h3');
                    subtitleEl.className = 'intro-subtitle';
                    subtitleEl.style.fontSize = '1.25rem';
                    subtitleEl.style.fontWeight = '400';
                    subtitleEl.style.color = 'var(--text-secondary)';
                    subtitleEl.style.marginTop = '-10px';
                    subtitleEl.style.marginBottom = '20px';
                    titleEl.parentNode.insertBefore(subtitleEl, titleEl.nextSibling);
                }
                subtitleEl.textContent = meta.introSubtitle;
            }
        }

        // Text (Description)
        if (meta.introText) {
            const introContainer = document.querySelector('.intro-text') || document.getElementById('intro-text-container');
            if (introContainer) {
                // If it has a quote block, we save it
                const quoteBlock = introContainer.querySelector('.quote-block');
                
                const paragraphs = meta.introText.split('\n').filter(p => p.trim().length > 0);
                const pHTML = paragraphs.map(p => `<p>${p}</p>`).join('');
                
                // Rebuild container, preserving h2 and adding/updating quote block
                const titleHTML = meta.introTitle ? `<h2>${meta.introTitle}</h2>` : (introContainer.querySelector('h2')?.outerHTML || '');
                
                // If meta has a quote, use it. Otherwise try to preserve existing or empty.
                let quoteHTML = '';
                if (meta.introQuote) {
                    quoteHTML = `
                        <div class="quote-block">
                            <p>"${meta.introQuote}"</p>
                        </div>
                    `;
                } else if (quoteBlock) {
                    quoteHTML = quoteBlock.outerHTML;
                }
                
                introContainer.innerHTML = titleHTML + pHTML + quoteHTML;
            } else {
                const firstP = document.querySelector('.content-main p');
                if (firstP) firstP.textContent = meta.introText;
            }
        }

        // Benefits
        if (meta.benefits && Array.isArray(meta.benefits) && meta.benefits.length > 0) {
            const listEl = document.querySelector('.benefits-list');
            const gridEl = document.querySelector('.benefits-cards');
            
            if (listEl) {
                listEl.innerHTML = meta.benefits.map(b => `
                    <li><i class="fa-solid fa-check"></i> <strong>${b}</strong></li>
                `).join('');
            } else if (gridEl) {
                gridEl.innerHTML = meta.benefits.map(b => {
                    const parts = b.split(':');
                    const title = parts[0] ? parts[0].trim() : b;
                    const desc = parts[1] ? parts[1].trim() : '';
                    
                    return `
                        <div class="benefit-card">
                            <div class="benefit-card-icon"><i class="fa-solid fa-circle-check"></i></div>
                            <h4>${title}</h4>
                            <p>${desc}</p>
                        </div>
                    `;
                }).join('');
            }
        }
    }

    renderHero(meta) {
        const heroSection = document.querySelector('.solution-hero') || document.querySelector('.hero');
        if (!heroSection) return;

        const showImage = meta.showHeroImage !== false;

        if (!showImage) {
            const bgDiv = heroSection.querySelector('.solution-hero-bg');
            if (bgDiv) {
                bgDiv.style.backgroundImage = 'none';
                bgDiv.style.backgroundColor = '#111';
            } else {
                heroSection.style.backgroundImage = 'none';
                heroSection.style.backgroundColor = '#111';
            }
        } else {
            // Sin imagen en la BD -> foto por defecto de la vertical (assets/web)
            const heroUrl = meta.heroImageUrl || `assets/web/vertical-${this.verticalId}.webp`;
            const bgDiv = heroSection.querySelector('.solution-hero-bg');
            if (bgDiv) {
                bgDiv.style.backgroundImage = `url('${heroUrl}')`;
                bgDiv.style.backgroundPosition = `${meta.heroPosX || 50}% ${meta.heroPosY || 50}%`;
                bgDiv.classList.add('dynamic-bg');
            } else {
                heroSection.style.backgroundImage = `url('${heroUrl}')`;
                heroSection.style.backgroundPosition = `${meta.heroPosX || 50}% ${meta.heroPosY || 50}%`;
                heroSection.classList.add('dynamic-bg');
            }
        }

        if (meta.heroTitle) {
            const h1 = heroSection.querySelector('h1');
            if (h1) h1.textContent = meta.heroTitle;
        }

        if (meta.heroSubtitle) {
            const lead = heroSection.querySelector('.solution-subtitle') || heroSection.querySelector('.lead');
            if (lead) lead.textContent = meta.heroSubtitle;
        }

        if (meta.badgeText || meta.badgeColor) {
            const badge = heroSection.querySelector('.solution-badge');
            if (badge) {
                if (meta.badgeText) badge.textContent = meta.badgeText;
                if (meta.badgeColor) {
                    badge.classList.remove('blue', 'orange', 'green', 'red', 'purple');
                    badge.classList.add(meta.badgeColor);
                }
            }
        }
    }

    updateSEO(meta) {
        if (!meta) return;
        if (meta.introTitle) {
            document.title = `${meta.introTitle} | 2N Solutions`;
        }
        if (meta.introText) {
            const metaDesc = document.querySelector('meta[name="description"]');
            if (metaDesc) {
                metaDesc.content = meta.introText.substring(0, 160) + (meta.introText.length > 160 ? '...' : '');
            }
        }
    }

    renderSections(sections) {
        if (!sections || sections.length === 0) {
             if (this.container) {
                this.container.innerHTML = '<div style="padding: 40px; text-align: center; color: #555;">No hay bloques destacados configurados.<br><small>Añade contenidos desde el panel de administración.</small></div>';
            }
            return;
        }

        // Filter hidden sections - Ensure we don't hide them by default
        const visibleSections = sections.filter(s => s.isVisible !== false && s.isActive !== false);

        if (visibleSections.length === 0) {
            if (this.container) {
                this.container.innerHTML = '<div style="padding: 40px; text-align: center; color: #555;">No hay bloques visibles configurados.</div>';
            }
            return;
        }

        // Cleanup
        if (this.dynamicContainer && this.staticShowcase) {
            this.staticShowcase.remove();
            this.staticShowcase = null;
        }

        this.container.innerHTML = '';

        visibleSections.forEach(section => {
            const sectionEl = document.createElement('div');
            const isFlip = section.layout === 'right' ? 'flip' : '';
            sectionEl.className = `feature-block ${isFlip}`;

            const pillsSpan = (section.tags || []).map(t => `<span class="feature-pill">${t}</span>`).join('');

            sectionEl.innerHTML = `
                <div class="feature-img">
                    <img src="${section.imageUrl || ''}" alt="${section.title || ''}" loading="lazy">
                </div>
                <div class="feature-body">
                    <div class="feature-eyebrow">${section.eyebrow || ''}</div>
                    <div class="feature-title">${section.title || ''}</div>
                    <p class="feature-desc">${section.text || ''}</p>
                    <div class="feature-pills">
                        ${pillsSpan}
                    </div>
                </div>
            `;
            this.container.appendChild(sectionEl);
        });
    }

    initScrollAnimations() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        });

        document.querySelectorAll('.feature-block').forEach(el => {
            observer.observe(el);
        });
    }

    renderTechCards(cards) {
        if (!cards || cards.length === 0) return;
        let grid = document.querySelector('.tech-grid');
        if (!grid) return;
        
        // Dynamic title requested by user
        const titleEl = document.querySelector('.tech-section .section-title');
        if (titleEl) {
            const verticalMap = {
                'bts': 'BTS Inteligente',
                'btr': 'BTR Inteligente',
                'hotel': 'Hoteles Inteligentes',
                'office': 'Oficinas Inteligentes',
                'security': 'Seguridad Avanzada',
                'retail': 'Retail Inteligente'
            };
            const vName = verticalMap[this.verticalId] || this.verticalId.toUpperCase();
            titleEl.textContent = `Dispositivos 2N recomendados para ${vName}`;
        }
        
        grid.innerHTML = '';
        const categoryMap = {
            'intercom': 'Intercomunicadores IP',
            'access': 'Sistemas de Acceso',
            'indoor': 'Unidades Interiores',
            'software': 'Software y Licencias',
            'aux': 'Accesorios Extras'
        };

        cards.forEach(card => {
            const label = categoryMap[card.category] || card.category || 'Dispositivo';
            const html = `
                <div class="tech-card">
                    ${card.imageUrl ? `
                    <div class="tech-card-img" style="width:100%; height:140px; background:rgba(255,255,255,0.03); margin-bottom:1.5rem; border-radius:8px; overflow:hidden; display:flex; align-items:center; justify-content:center; padding:10px;">
                        <img src="${card.imageUrl}" style="max-width:100%; max-height:100%; object-fit:contain; filter:drop-shadow(0 10px 20px rgba(0,0,0,0.4));" loading="lazy">
                    </div>
                    ` : ''}
                    <div class="tech-card-label">${label}</div>
                    <div class="tech-card-name">${card.name}</div>
                    <p class="tech-card-desc">${card.description || ''}</p>
                    <div class="tech-card-tags">
                        ${(card.tags || []).slice(0,4).map(t => `<span class="tech-tag">${t}</span>`).join('')}
                    </div>
                </div>
            `;
            grid.insertAdjacentHTML('beforeend', html);
        });
    }

    renderCases(cases) {
        if (!cases || cases.length === 0) return;
        let grid = document.querySelector('.casos-grid');
        if (!grid) return;
        
        grid.className = 'casos-zigzag-container'; 
        grid.innerHTML = '';
        
        cases.forEach((c, index) => {
            const verticalMap = {
                'bts': 'BTS',
                'btr': 'BTR',
                'hotel': 'HOTEL',
                'office': 'OFICINAS',
                'security': 'SEGURIDAD',
                'retail': 'RETAIL'
            };
            const vertText = (c.verticals || []).map(v => verticalMap[v] || v.toUpperCase()).join(' · ');
            const badgeText = `${vertText} · ESPAÑA`;

            const html = `
                <div class="caso-zigzag-row">
                    <div class="caso-zigzag-text">
                        <span class="caso-zigzag-badge">${badgeText}</span>
                        <h3 class="caso-zigzag-title">${c.name}</h3>
                        <p class="caso-zigzag-description">${c.description || ''}</p>
                        <div class="caso-zigzag-tags">
                            ${(c.items || []).map(i => `<span class="caso-zigzag-tag-item">${i}</span>`).join('')}
                        </div>
                    </div>
                    <div class="caso-zigzag-image">
                        <img src="${c.imageUrl || 'assets/placeholder-case.jpg'}" alt="${c.name}" loading="lazy">
                    </div>
                </div>
            `;
            grid.insertAdjacentHTML('beforeend', html);
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new VerticalRenderer();
});
