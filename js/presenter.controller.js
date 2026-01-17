/**
 * 2N Presenter - Presentation Controller
 * Handles building and viewing slides
 */

import { auth, db } from './firebase-init.js';
import {
    collection,
    getDocs,
    query,
    where,
    orderBy
} from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js';
import authController from './auth.controller.js';
import i18n from './i18n.js';

class PresenterController {
    constructor() {
        this.selectedVerticals = [];
        this.selectedSections = [];
        this.availableSections = [];
        this.slides = [];
        this.currentSlide = 0;
        this.isPresenting = false;
        this.init();
    }

    async init() {
        // Require auth
        try {
            await authController.requireAuth();
        } catch (e) {
            return;
        }

        // Update user name display
        const userNameEl = document.getElementById('user-name');
        if (userNameEl && auth.currentUser) {
            userNameEl.textContent = auth.currentUser.email.split('@')[0];
        }

        this.bindEvents();
    }

    bindEvents() {
        // Vertical selection
        document.querySelectorAll('input[name="verticals"]').forEach(cb => {
            cb.addEventListener('change', () => this.handleVerticalChange());
        });

        // Preview button
        const previewBtn = document.getElementById('preview-btn');
        if (previewBtn) {
            previewBtn.addEventListener('click', () => this.generatePreview());
        }

        // Present button
        const presentBtn = document.getElementById('present-btn');
        if (presentBtn) {
            presentBtn.addEventListener('click', () => this.startPresentation());
        }

        // Navigation
        document.getElementById('prev-slide')?.addEventListener('click', () => this.prevSlide());
        document.getElementById('next-slide')?.addEventListener('click', () => this.nextSlide());
        document.getElementById('pres-prev')?.addEventListener('click', () => this.prevSlide(true));
        document.getElementById('pres-next')?.addEventListener('click', () => this.nextSlide(true));

        // Exit presentation
        document.getElementById('exit-presentation')?.addEventListener('click', () => this.exitPresentation());

        // Keyboard navigation
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));
    }

    // ============================
    // VERTICAL & SECTION SELECTION
    // ============================
    handleVerticalChange() {
        const checkboxes = document.querySelectorAll('input[name="verticals"]:checked');
        this.selectedVerticals = Array.from(checkboxes).map(cb => cb.value);
        this.loadSectionsForVerticals();
        this.updateButtonStates();
    }

    async loadSectionsForVerticals() {
        const container = document.getElementById('sections-selector');
        if (!container) return;

        if (this.selectedVerticals.length === 0) {
            container.innerHTML = '<p class="placeholder-text">Selecciona al menos una vertical para ver las secciones disponibles</p>';
            this.availableSections = [];
            return;
        }

        container.innerHTML = '<p class="placeholder-text">Cargando secciones...</p>';

        try {
            const sectionsRef = collection(db, 'sections');
            const q = query(
                sectionsRef,
                where('verticalId', 'in', this.selectedVerticals),
                where('isActive', '==', true),
                orderBy('order', 'asc')
            );
            const snapshot = await getDocs(q);

            if (snapshot.empty) {
                container.innerHTML = '<p class="placeholder-text">No hay secciones disponibles para las verticales seleccionadas</p>';
                this.availableSections = [];
                return;
            }

            this.availableSections = [];
            container.innerHTML = '';

            snapshot.forEach(doc => {
                const section = { id: doc.id, ...doc.data() };
                this.availableSections.push(section);

                const lang = i18n.currentLang;
                const title = section.title?.[lang] || section.title?.es || 'Sin título';
                const verticalLabel = i18n.t(`verticals.${section.verticalId}`);

                const item = document.createElement('div');
                item.className = 'section-item';
                item.innerHTML = `
                    <input type="checkbox" id="section-${doc.id}" value="${doc.id}">
                    <label for="section-${doc.id}">${title}</label>
                    <span class="section-vertical-tag">${verticalLabel}</span>
                `;

                item.querySelector('input').addEventListener('change', (e) => {
                    this.handleSectionToggle(doc.id, e.target.checked);
                });

                container.appendChild(item);
            });
        } catch (error) {
            console.error('Error loading sections:', error);
            container.innerHTML = '<p class="placeholder-text error">Error al cargar secciones</p>';
        }
    }

    handleSectionToggle(sectionId, isSelected) {
        if (isSelected) {
            if (!this.selectedSections.includes(sectionId)) {
                this.selectedSections.push(sectionId);
            }
        } else {
            this.selectedSections = this.selectedSections.filter(id => id !== sectionId);
        }
        this.updateButtonStates();
    }

    updateButtonStates() {
        const hasSelection = this.selectedSections.length > 0;
        document.getElementById('preview-btn').disabled = !hasSelection;
        document.getElementById('present-btn').disabled = !hasSelection;
    }

    // ============================
    // SLIDE GENERATION
    // ============================
    generatePreview() {
        const lang = i18n.currentLang;
        this.slides = [];

        // Title slide
        this.slides.push({
            type: 'title',
            title: 'Presentación 2N',
            subtitle: this.selectedVerticals.map(v => i18n.t(`verticals.${v}`)).join(' | ')
        });

        // Content slides from selected sections
        this.selectedSections.forEach(sectionId => {
            const section = this.availableSections.find(s => s.id === sectionId);
            if (section) {
                this.slides.push({
                    type: 'content',
                    title: section.title?.[lang] || section.title?.es || 'Sin título',
                    content: section.content?.[lang] || section.content?.es || '',
                    images: section.images || []
                });
            }
        });

        // End slide
        this.slides.push({
            type: 'end',
            title: 'Gracias',
            subtitle: '2N Telekomunikace a.s.'
        });

        this.renderSlides();
        this.currentSlide = 0;
        this.updateSlideDisplay();
    }

    renderSlides() {
        const container = document.getElementById('slides-container');
        const placeholder = document.getElementById('preview-placeholder');
        const nav = document.getElementById('slides-nav');

        if (!container) return;

        placeholder.classList.add('hidden');
        container.classList.remove('hidden');
        nav.classList.remove('hidden');

        container.innerHTML = '';

        this.slides.forEach((slide, index) => {
            const slideEl = document.createElement('div');
            slideEl.className = `slide ${index === 0 ? 'active' : ''}`;
            slideEl.dataset.index = index;

            let content = '';
            switch (slide.type) {
                case 'title':
                    content = `
                        <div class="slide-content" style="justify-content: center; text-align: center;">
                            <h1 class="slide-title" style="font-size: 3rem;">${slide.title}</h1>
                            <p class="slide-body" style="font-size: 1.5rem;">${slide.subtitle}</p>
                        </div>
                    `;
                    break;
                case 'content':
                    content = `
                        <div class="slide-content">
                            <h2 class="slide-title">${slide.title}</h2>
                            <div class="slide-body">${slide.content}</div>
                        </div>
                    `;
                    break;
                case 'end':
                    content = `
                        <div class="slide-content" style="justify-content: center; text-align: center; background: linear-gradient(135deg, var(--primary-dark), var(--bg-card));">
                            <h1 class="slide-title" style="font-size: 4rem; color: white;">${slide.title}</h1>
                            <p class="slide-body" style="color: rgba(255,255,255,0.7);">${slide.subtitle}</p>
                        </div>
                    `;
                    break;
            }

            slideEl.innerHTML = content;
            container.appendChild(slideEl);
        });

        // Update total count
        document.getElementById('total-slides').textContent = this.slides.length;
    }

    updateSlideDisplay() {
        document.querySelectorAll('.slide').forEach((slide, index) => {
            slide.classList.toggle('active', index === this.currentSlide);
        });

        document.getElementById('current-slide').textContent = this.currentSlide + 1;
        if (this.isPresenting) {
            document.getElementById('pres-current').textContent = this.currentSlide + 1;
        }

        // Update nav buttons
        document.getElementById('prev-slide').disabled = this.currentSlide === 0;
        document.getElementById('next-slide').disabled = this.currentSlide === this.slides.length - 1;
    }

    prevSlide(fullscreen = false) {
        if (this.currentSlide > 0) {
            this.currentSlide--;
            this.updateSlideDisplay();
            if (fullscreen) this.syncPresentationSlide();
        }
    }

    nextSlide(fullscreen = false) {
        if (this.currentSlide < this.slides.length - 1) {
            this.currentSlide++;
            this.updateSlideDisplay();
            if (fullscreen) this.syncPresentationSlide();
        }
    }

    // ============================
    // FULLSCREEN PRESENTATION
    // ============================
    startPresentation() {
        if (this.slides.length === 0) {
            this.generatePreview();
        }

        this.isPresenting = true;
        const presentationMode = document.getElementById('presentation-mode');
        const presSlides = document.getElementById('presentation-slides');

        // Clone slides
        presSlides.innerHTML = document.getElementById('slides-container').innerHTML;

        document.getElementById('pres-total').textContent = this.slides.length;

        presentationMode.classList.remove('hidden');
        this.syncPresentationSlide();

        // Request fullscreen
        if (document.documentElement.requestFullscreen) {
            document.documentElement.requestFullscreen();
        }
    }

    syncPresentationSlide() {
        const presentationSlides = document.querySelectorAll('#presentation-slides .slide');
        presentationSlides.forEach((slide, index) => {
            slide.classList.toggle('active', index === this.currentSlide);
        });
        document.getElementById('pres-current').textContent = this.currentSlide + 1;
    }

    exitPresentation() {
        this.isPresenting = false;
        document.getElementById('presentation-mode').classList.add('hidden');

        if (document.exitFullscreen) {
            document.exitFullscreen().catch(() => { });
        }
    }

    handleKeyboard(e) {
        if (!this.isPresenting && this.slides.length === 0) return;

        switch (e.key) {
            case 'ArrowRight':
            case 'ArrowDown':
            case ' ':
                e.preventDefault();
                this.nextSlide(this.isPresenting);
                break;
            case 'ArrowLeft':
            case 'ArrowUp':
                e.preventDefault();
                this.prevSlide(this.isPresenting);
                break;
            case 'Escape':
                if (this.isPresenting) {
                    this.exitPresentation();
                }
                break;
            case 'f':
            case 'F':
                if (!this.isPresenting && this.slides.length > 0) {
                    this.startPresentation();
                }
                break;
        }
    }
}

// Create singleton
const presenterController = new PresenterController();
window.presenterController = presenterController;

export default presenterController;
