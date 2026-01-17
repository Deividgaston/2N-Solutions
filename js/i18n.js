import { translations } from './translations.js';

class I18nManager {
    constructor() {
        this.currentLang = localStorage.getItem('2n_lang') || 'es';
        this.flags = {
            es: 'fi-es',
            en: 'fi-gb',
            pt: 'fi-pt',
            fr: 'fi-fr',
            it: 'fi-it'
        };
        // Don't auto-init in constructor, wait for DOM or manual call
        if (document.readyState !== 'loading') {
            this.init();
        } else {
            document.addEventListener('DOMContentLoaded', () => this.init());
        }
    }

    init() {
        this.setupListeners();
        this.updateContent();
        this.updateSelector();
    }

    setupListeners() {
        // Handle dropdown buttons if they exist
        document.querySelectorAll('.lang-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const lang = btn.getAttribute('data-lang');
                if (lang) {
                    // Update active state
                    document.querySelectorAll('.lang-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    this.setLanguage(lang);
                }
            });
        });
    }

    setLanguage(lang) {
        this.currentLang = lang;
        localStorage.setItem('2n_lang', lang);
        this.updateContent();
        this.updateSelector();
    }

    t(key) {
        return this.getNestedValue(translations[this.currentLang], key) || key;
    }

    getNestedValue(obj, path) {
        return path.split('.').reduce((prev, curr) => {
            return prev ? prev[curr] : null;
        }, obj);
    }

    updateContent() {
        const currentTranslations = translations[this.currentLang];
        if (!currentTranslations) return;

        document.querySelectorAll('[data-i18n]').forEach(element => {
            const key = element.getAttribute('data-i18n');
            const translation = this.getNestedValue(currentTranslations, key);

            if (translation) {
                if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                    element.placeholder = translation;
                } else {
                    element.textContent = translation;
                }
            }
        });
    }

    updateSelector() {
        // Logic for the simple button selector on login page
        const activeBtn = document.querySelector(`.lang-btn[data-lang="${this.currentLang}"]`);
        if (activeBtn) {
            document.querySelectorAll('.lang-btn').forEach(b => b.classList.remove('active'));
            activeBtn.classList.add('active');
        }
    }
}

const i18n = new I18nManager();
window.i18n = i18n; // For global access/debugging
export default i18n;
