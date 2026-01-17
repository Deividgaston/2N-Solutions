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
        this.init();
    }

    init() {
        this.setupListeners();
        this.updateContent();
        this.updateSelector();
    }

    setupListeners() {
        document.querySelectorAll('.lang-option').forEach(option => {
            option.addEventListener('click', (e) => {
                e.preventDefault();
                // Find the closest anchor if click was on span
                const target = e.target.closest('.lang-option');
                // Extract lang code from flag class (e.g. 'fi-es' -> 'es') but safer to store it in data attr
                // Adding data-lang to options would be better, but I'll parse it for now or rely on text

                // Let's assume I'll add data-lang to HTML in the next step. 
                // For now, I'll infer from the second span's text content mapping or add data attributes.
                // Actually, I'll rely on the index or text.
                // BETTER: I will add data-lang="{lang}" to the HTML elements in the next step.
                const lang = target.getAttribute('data-lang');
                if (lang) {
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

    updateContent() {
        const texts = translations[this.currentLang];
        document.querySelectorAll('[data-i18n]').forEach(element => {
            const key = element.getAttribute('data-i18n');
            if (texts[key]) {
                // Check if it's an input/placeholder or text
                if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                    element.placeholder = texts[key];
                } else {
                    element.textContent = texts[key];
                }
            }
        });
    }

    updateSelector() {
        const btn = document.querySelector('.lang-btn');
        const flagSpan = btn.querySelector('.fi');
        const textSpan = btn.querySelector('span:nth-child(2)');

        // Update flag
        flagSpan.className = `fi ${this.flags[this.currentLang]}`;

        // Update text
        textSpan.textContent = this.currentLang.toUpperCase();
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.i18n = new I18nManager();
});
