/**
 * 2N — kit de motion v3 para las páginas interiores (la portada usa home.js).
 * Barra de progreso + reveals al hacer scroll. Respeta prefers-reduced-motion.
 */
(function () {
    'use strict';
    if (typeof window.gsap === 'undefined' || typeof window.ScrollTrigger === 'undefined') return;

    gsap.registerPlugin(ScrollTrigger);
    document.documentElement.classList.add('gsap-on');

    var progress = document.getElementById('scroll-progress');
    if (progress) {
        gsap.to(progress, {
            scaleX: 1,
            ease: 'none',
            scrollTrigger: { start: 0, end: 'max', scrub: 0.4 },
        });
    }

    var mm = gsap.matchMedia();

    mm.add('(prefers-reduced-motion: no-preference)', function () {
        gsap.utils.toArray('[data-reveal]').forEach(function (el, i) {
            gsap.fromTo(el,
                { opacity: 0, y: 26 },
                {
                    opacity: 1, y: 0, duration: 0.85, ease: 'power3.out',
                    delay: i < 3 ? 0.15 + i * 0.12 : 0, // cascada solo en el hero
                    scrollTrigger: { trigger: el, start: 'top 90%', once: true },
                },
            );
        });
    });

    mm.add('(prefers-reduced-motion: reduce)', function () {
        gsap.set('[data-reveal]', { opacity: 1, y: 0 });
    });
})();
