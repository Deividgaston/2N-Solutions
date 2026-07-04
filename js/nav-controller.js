/**
 * nav-controller.js
 * Centralized logic for the 2N Presenter Navbar
 */

class NavController {
    constructor() {
        if (window._navControllerActive) return;
        window._navControllerActive = true;

        this.navbar = document.getElementById('navbar');
        this.contactBtn = document.getElementById('contact-btn');
        this.contactModal = document.getElementById('contact-modal');
        this.modalClose = document.getElementById('modal-close');
        
        this.init();
    }

    init() {
        if (!this.navbar) return;

        // Scroll Effect
        window.addEventListener('scroll', () => {
            this.navbar.classList.toggle('scrolled', window.scrollY > 50);
        });

        // Mobile Menu Button Injection
        const btn = document.createElement('button');
        btn.className = 'mobile-menu-btn';
        btn.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>';
        this.navbar.appendChild(btn);

        btn.addEventListener('click', () => {
            const isOpen = document.body.classList.contains('mobile-open');
            if (isOpen) {
                document.body.classList.remove('mobile-open');
                btn.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>';
            } else {
                document.body.classList.add('mobile-open');
                btn.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
            }
        });

        // Contact Modal Logic
        if (this.contactBtn && this.contactModal) {
            this.contactBtn.addEventListener('click', () => {
                this.contactModal.classList.add('active');
                document.body.style.overflow = 'hidden';
            });

            const closeAction = () => {
                this.contactModal.classList.remove('active');
                document.body.style.overflow = '';
            };

            if (this.modalClose) this.modalClose.addEventListener('click', closeAction);
            this.contactModal.addEventListener('click', (e) => {
                if (e.target === this.contactModal) closeAction();
            });
        }

        // Share Logic
        this.initShare();
    }

    initShare() {
        const shareWa = document.getElementById('share-wa');
        const shareMail = document.getElementById('share-mail');
        const shareCopy = document.getElementById('share-copy');
        
        const shareData = {
            title: '2N Presenter - Soluciones de Acceso IP',
            text: 'Descubre las soluciones de control de acceso premium de 2N.',
            url: window.location.href
        };

        if (shareWa) {
            shareWa.addEventListener('click', () => {
                window.open(`https://wa.me/?text=${encodeURIComponent(shareData.text + ' ' + shareData.url)}`, '_blank');
            });
        }

        if (shareMail) {
            shareMail.addEventListener('click', () => {
                window.location.href = `mailto:?subject=${encodeURIComponent(shareData.title)}&body=${encodeURIComponent(shareData.text + '\n\n' + shareData.url)}`;
            });
        }

        if (shareCopy) {
            shareCopy.addEventListener('click', () => {
                navigator.clipboard.writeText(shareData.url).then(() => {
                    const original = shareCopy.innerHTML;
                    shareCopy.innerHTML = '<i class="fa-solid fa-check" style="color:#22c55e"></i> ¡Copiado!';
                    setTimeout(() => { shareCopy.innerHTML = original; }, 2000);
                });
            });
        }
    }
}

// Auto-initialize robustly
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new NavController());
} else {
    new NavController();
}
