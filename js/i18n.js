/**
 * 2N Presenter - Internationalization (i18n) Module
 * Handles multi-language support for ES, EN, PT
 */

class I18n {
    constructor() {
        this.translations = {};
        this.currentLang = this.getStoredLanguage() || 'es';
        this.supportedLangs = ['es', 'en', 'pt'];
    }

    /**
     * Get stored language preference from localStorage
     */
    getStoredLanguage() {
        return localStorage.getItem('2n-presenter-lang');
    }

    /**
     * Set and store language preference
     */
    setLanguage(lang) {
        if (!this.supportedLangs.includes(lang)) {
            console.warn(`Language ${lang} not supported. Falling back to 'es'.`);
            lang = 'es';
        }
        this.currentLang = lang;
        localStorage.setItem('2n-presenter-lang', lang);
        document.documentElement.lang = lang;
        this.updatePageTranslations();
        this.updateLanguageButtons();
    }

    /**
     * Load translations for a specific language
     */
    async loadTranslations(lang) {
        if (this.translations[lang]) {
            return this.translations[lang];
        }

        try {
            const response = await fetch(`locales/${lang}.json`);
            if (!response.ok) throw new Error(`Failed to load ${lang} translations`);
            this.translations[lang] = await response.json();
            return this.translations[lang];
        } catch (error) {
            console.error(`Error loading translations for ${lang}:`, error);
            return {};
        }
    }

    /**
     * Get translation by key path (e.g., 'login.title')
     */
    t(keyPath) {
        const keys = keyPath.split('.');
        let value = this.translations[this.currentLang];

        for (const key of keys) {
            if (value && typeof value === 'object' && key in value) {
                value = value[key];
            } else {
                console.warn(`Translation key not found: ${keyPath}`);
                return keyPath; // Return key as fallback
            }
        }

        return value;
    }

    /**
     * Update all elements with data-i18n attribute
     */
    updatePageTranslations() {
        const elements = document.querySelectorAll('[data-i18n]');
        elements.forEach(el => {
            const key = el.getAttribute('data-i18n');
            const translation = this.t(key);

            // Handle different element types
            if (el.tagName === 'INPUT' && el.hasAttribute('placeholder')) {
                el.placeholder = translation;
            } else {
                el.textContent = translation;
            }
        });
    }

    /**
     * Update language selector buttons
     */
    updateLanguageButtons() {
        const buttons = document.querySelectorAll('.lang-btn');
        buttons.forEach(btn => {
            const lang = btn.getAttribute('data-lang');
            btn.classList.toggle('active', lang === this.currentLang);
        });
    }

    /**
     * Initialize i18n system
     */
    async init() {
        // Load current language translations
        await this.loadTranslations(this.currentLang);

        // Update page
        this.updatePageTranslations();
        this.updateLanguageButtons();

        // Bind language selector buttons
        document.querySelectorAll('.lang-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const lang = e.target.getAttribute('data-lang');
                await this.loadTranslations(lang);
                this.setLanguage(lang);
            });
        });

        return this;
    }
}

// Create and export singleton instance
const i18n = new I18n();

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => i18n.init());
} else {
    i18n.init();
}

export default i18n;
