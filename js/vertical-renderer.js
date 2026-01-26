
/**
 * 2N Presenter - Vertical Renderer
 * Fetches and renders dynamic content sections for vertical landing pages.
 */

import { contentService } from './services/content.service.js';

class VerticalRenderer {
    constructor() {
        this.container = document.getElementById('dynamic-sections-container');
        this.verticalId = document.body.dataset.vertical || document.querySelector('[data-vertical]')?.dataset.vertical;

        if (this.container && this.verticalId) {
            this.init();
        } else {
            console.warn('VerticalRenderer: Missing container (#dynamic-sections-container) or data-vertical attribute.');
        }
    }

    async init() {
        // Visual Debugging
        if (this.container) {
            this.container.innerHTML = '<div style="padding: 20px; text-align: center; color: #888;" class="debug-loader"><i class="fa-solid fa-spinner fa-spin"></i> Cargando contenidos dinámicos...</div>';
        }

        try {
            console.log('VerticalRenderer: Fetching for', this.verticalId);

            // Parallel fetch: Sections + Intro Meta
            const [sections, meta] = await Promise.all([
                contentService.getSections(this.verticalId),
                contentService.getVerticalMeta(this.verticalId)
            ]);

            console.log('VerticalRenderer: Data received', { sections: sections?.length, meta });

            // Clear loader
            if (this.container) this.container.innerHTML = '';

            this.renderIntro(meta);
            this.updateSEO(meta);
            this.renderSections(sections);
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
            const titleEl = document.querySelector('.content-main h2');
            if (titleEl) titleEl.textContent = meta.introTitle;
        }

        // Subtitle
        if (meta.introSubtitle) {
            const titleEl = document.querySelector('.content-main h2');
            if (titleEl) {
                let subtitleEl = document.querySelector('.intro-subtitle');
                if (!subtitleEl) {
                    subtitleEl = document.createElement('h3');
                    subtitleEl.className = 'intro-subtitle'; // You might want to style this in CSS
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
            const introContainer = document.getElementById('intro-text-container');
            // Fallback if no container (try to append or find logical place? For now assume container exists or we skip)
            if (introContainer) {
                const paragraphs = meta.introText.split('\n').filter(p => p.trim().length > 0);
                introContainer.innerHTML = paragraphs.map(p => `<p>${p}</p>`).join('');
            } else {
                // Fallback for pages without container: try to find first p
                const firstP = document.querySelector('.content-main p');
                if (firstP) firstP.textContent = meta.introText;
            }
        }

        // Benefits
        if (meta.benefits && Array.isArray(meta.benefits) && meta.benefits.length > 0) {
            const listEl = document.querySelector('.benefits-list');
            if (listEl) {
                listEl.innerHTML = meta.benefits.map(b => `
                    <li><i class="fa-solid fa-check"></i> <strong>${b}</strong></li>
                `).join('');
            }
        }
    }

    renderHero(meta) {
        // Selector fix: Solution pages use 'solution-hero', not 'hero'
        const heroSection = document.querySelector('.solution-hero') || document.querySelector('.hero');
        if (!heroSection) return;

        // Background Image
        const showImage = meta.showHeroImage !== false; // Default true

        if (!showImage) {
            // Hide image if disabled
            const bgDiv = heroSection.querySelector('.solution-hero-bg');
            if (bgDiv) {
                bgDiv.style.backgroundImage = 'none';
                bgDiv.style.backgroundColor = '#111';
            } else {
                heroSection.style.backgroundImage = 'none';
                heroSection.style.backgroundColor = '#111';
            }
        } else if (meta.heroImageUrl) {
            // Find the background div or apply to section
            const bgDiv = heroSection.querySelector('.solution-hero-bg');
            if (bgDiv) {
                bgDiv.style.backgroundImage = `url('${meta.heroImageUrl}')`;
                bgDiv.style.backgroundPosition = `${meta.heroPosX || 50}% ${meta.heroPosY || 50}%`;
                bgDiv.classList.add('dynamic-bg');
            } else {
                heroSection.style.backgroundImage = `url('${meta.heroImageUrl}')`;
                heroSection.style.backgroundPosition = `${meta.heroPosX || 50}% ${meta.heroPosY || 50}%`;
                heroSection.classList.add('dynamic-bg');
            }
        }

        // Title
        if (meta.heroTitle) {
            const h1 = heroSection.querySelector('h1');
            if (h1) h1.textContent = meta.heroTitle;
        }

        // Subtitle/Lead
        if (meta.heroSubtitle) {
            // Selector fix: Solution pages use 'solution-subtitle', not 'lead'
            const lead = heroSection.querySelector('.solution-subtitle') || heroSection.querySelector('.lead');
            if (lead) lead.textContent = meta.heroSubtitle;
        }

        // Badge
        if (meta.badgeText || meta.badgeColor) {
            const badge = heroSection.querySelector('.solution-badge');
            if (badge) {
                if (meta.badgeText) badge.textContent = meta.badgeText;
                if (meta.badgeColor) {
                    // Remove old color classes
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
                // Truncate to ~160 chars for SEO
                metaDesc.content = meta.introText.substring(0, 160) + (meta.introText.length > 160 ? '...' : '');
            }
        }
    }

    async checkAdminVisibility() {
        // Simple check using firebase auth directly
        // We need to wait for auth state
        const { getAuth, onAuthStateChanged } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js');
        const { getFirestore, doc, getDoc } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js');

        const auth = getAuth();
        const db = getFirestore();

        onAuthStateChanged(auth, async (user) => {
            if (user) {
                // Check role
                try {
                    const userSnap = await getDoc(doc(db, 'users', user.uid));
                    if (userSnap.exists() && userSnap.data().role === 'admin') {
                        // Show buttons
                        document.querySelectorAll('.btn-ppt-export').forEach(btn => {
                            btn.style.display = 'inline-block';
                        });
                    }
                } catch (e) {
                    console.error("Error checking role", e);
                }
            }
        });
    }

    renderSections(sections) {
        if (!sections || sections.length === 0) return;

        // Filter hidden sections (isVisible !== false to support legacy data which is undefined)
        const visibleSections = sections.filter(s => s.isVisible !== false);

        this.container.innerHTML = '';

        visibleSections.forEach(section => {
            const sectionEl = document.createElement('div');
            // Determine layout class (default to left if missing)
            const layoutClass = `layout-${section.layout || 'left'}`;

            sectionEl.className = `dynamic-section ${layoutClass}`;

            // Image HTML
            let imageHtml = '';
            if (section.imageUrl) {
                const isVideo = section.imageUrl.match(/\.(mp4|webm)$/i);
                imageHtml = `
                    <div class="ds-image-wrapper">
                        ${isVideo
                        ? `<video src="${section.imageUrl}" autoplay loop muted playsinline></video>`
                        : `<img src="${section.imageUrl}" alt="${section.title || 'Imagen de sección'}" loading="lazy">`
                    }
                    </div>
                `;
            } else {
                // If no image, maybe full width text? 
                // For 'right' or 'left' layouts without image, it looks empty. To fix, we could center text.
                // But typically users upload images. If text-only, we might want to hide the image wrapper div.
                // Current CSS flex will make text take 50%.
                // Let's leave it as is, or handle text-only logic if needed.
                // With current CSS: if no imageHtml, flex will look weird. 
                // Let's check logic: if no image, we might want to remove the wrapper entirely.
            }

            // Title HTML (optional)
            const titleHtml = section.title ? `<h3 class="ds-title">${section.title}</h3>` : '';

            // Content HTML
            const contentHtml = `
            <div class="ds-content" style="text-align: ${section.textAlign || 'left'}">
                ${titleHtml}
                    <div class="ds-text" style="text-align: ${section.textAlign || 'left'}">${section.text}</div>
                </div>
            `;

            // HTML Structure based on layout (but CSS handles row-reverse for right)
            // We just append both. CSS handles order.

            sectionEl.innerHTML = `
                ${imageHtml}
                ${contentHtml}
            `;

            this.container.appendChild(sectionEl);
        });

        // Check Admin Role to show buttons
        // this.checkAdminVisibility(); // Not needed for public page anymore


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

        document.querySelectorAll('.dynamic-section').forEach(el => {
            observer.observe(el);
        });
    }
}

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    new VerticalRenderer();
});
