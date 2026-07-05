/**
 * 2N Presenter — Home v3 (landing editorial/cinemática)
 * - Coreografía GSAP + ScrollTrigger: reveal de líneas del hero, parallax,
 *   galería horizontal pinneada de soluciones, count-ups, reveals.
 *   Respeta prefers-reduced-motion (todo visible, sin pin).
 * - Casos destacados desde Firestore por REST (la landing no carga el SDK).
 * - Formulario de prescripción -> colección web_leads (create público validado).
 */
(function () {
    'use strict';

    // Misma config que js/firebase-init.js (solo lectura pública + create de leads)
    var PROJECT = 'crm-obras-prod';
    var API_KEY = 'AIzaSyBdTl2XXdo9ks-qqhBqDdXk8uLb65qyD-I';
    var FS_BASE = 'https://firestore.googleapis.com/v1/projects/' + PROJECT + '/databases/(default)/documents';

    var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var gsapOk = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';

    /* ────────────────────────────────
       MOTION (GSAP)
    ──────────────────────────────── */
    if (gsapOk) {
        gsap.registerPlugin(ScrollTrigger);
        document.documentElement.classList.add('gsap-on');

        // Barra de progreso de lectura
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
            // Intro del hero: líneas del titular + badge + pie, y "ken burns" de la foto
            var tl = gsap.timeline({ defaults: { ease: 'power4.out' } });
            tl.fromTo('.hero-media img', { scale: 1.18 }, { scale: 1.08, duration: 2.4, ease: 'power2.out' }, 0)
              .to('.hero .hero-badge', { opacity: 1, y: 0, duration: 0.7 }, 0.15)
              .to('.hero h1 .line-inner', { y: 0, duration: 1.05, stagger: 0.12 }, 0.25)
              .to('.hero .hero-foot [data-reveal]', { opacity: 1, y: 0, duration: 0.8, stagger: 0.12 }, 0.8);
            gsap.set('.hero .hero-badge', { y: 16 });
            gsap.set('.hero .hero-foot [data-reveal]', { y: 20 });

            // Parallax sutil de la foto al hacer scroll
            gsap.to('.hero-media img', {
                yPercent: 10,
                ease: 'none',
                scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true },
            });

            // Galería horizontal pinneada (solo desktop)
            var track = document.getElementById('htrack');
            var hwrap = document.getElementById('hscroll');
            if (track && hwrap && window.innerWidth >= 1024) {
                var dist = function () { return Math.max(0, track.scrollWidth - window.innerWidth); };
                gsap.to(track, {
                    x: function () { return -dist(); },
                    ease: 'none',
                    scrollTrigger: {
                        trigger: hwrap,
                        start: 'top top',
                        end: function () { return '+=' + dist(); },
                        scrub: 1,
                        pin: true,
                        anticipatePin: 1,
                        invalidateOnRefresh: true,
                    },
                });
            }

            // Reveals genéricos al hacer scroll (fuera del hero)
            gsap.utils.toArray('section [data-reveal]').forEach(function (el) {
                gsap.fromTo(el,
                    { opacity: 0, y: 26 },
                    {
                        opacity: 1, y: 0, duration: 0.8, ease: 'power3.out',
                        scrollTrigger: { trigger: el, start: 'top 88%', once: true },
                    },
                );
            });

            // Count-up de las cifras
            gsap.utils.toArray('[data-count]').forEach(function (el) {
                var target = parseInt(el.getAttribute('data-count'), 10);
                var obj = { v: 0 };
                gsap.to(obj, {
                    v: target,
                    duration: 1.5,
                    ease: 'power2.out',
                    scrollTrigger: { trigger: el, start: 'top 92%', once: true },
                    onUpdate: function () { el.textContent = Math.round(obj.v); },
                });
            });
        });

        mm.add('(prefers-reduced-motion: reduce)', function () {
            gsap.set('[data-reveal]', { opacity: 1, y: 0 });
            gsap.set('.hero h1 .line-inner', { y: 0 });
        });
    }

    /* ────────────────────────────────
       CASOS DESTACADOS (BD real)
    ──────────────────────────────── */
    function fv(field) { // valor plano de un campo REST de Firestore
        if (!field) return null;
        if ('stringValue' in field) return field.stringValue;
        if ('integerValue' in field) return parseInt(field.integerValue, 10);
        if ('doubleValue' in field) return field.doubleValue;
        if ('arrayValue' in field) return (field.arrayValue.values || []).map(fv);
        return null;
    }

    var VERTICAL_NAMES = {
        bts: 'Residencial BTS', btr: 'Residencial BTR', office: 'Oficinas',
        hotel: 'Hoteles', retail: 'Retail', security: 'Seguridad'
    };

    function renderCases(cases) {
        var grid = document.getElementById('cases-grid');
        if (!grid) return;
        grid.innerHTML = '';
        cases.forEach(function (c, i) {
            var card = document.createElement('a');
            card.className = 'case-card';
            card.href = 'casos-exito.html';

            var photo = document.createElement('div');
            photo.className = 'case-photo';
            if (c.imageUrl) {
                var url = /^https?:\/\//.test(c.imageUrl) ? c.imageUrl : c.imageUrl.replace(/^\/?/, '');
                photo.style.backgroundImage = "url('" + url.replace(/'/g, "%27") + "')";
            }
            card.appendChild(photo);

            var idx = document.createElement('span');
            idx.className = 'case-index';
            idx.textContent = String(i + 1).padStart(2, '0');
            card.appendChild(idx);

            var body = document.createElement('div');
            body.className = 'case-body';

            var chips = document.createElement('div');
            chips.className = 'case-verticals';
            (c.verticals || []).slice(0, 3).forEach(function (v) {
                var chip = document.createElement('span');
                chip.className = 'case-vertical-chip';
                chip.textContent = VERTICAL_NAMES[v] || v;
                chips.appendChild(chip);
            });
            body.appendChild(chips);

            var h = document.createElement('h3');
            h.textContent = c.name || 'Proyecto 2N';
            body.appendChild(h);

            if (c.description) {
                var p = document.createElement('p');
                p.textContent = c.description;
                body.appendChild(p);
            }

            card.appendChild(body);
            grid.appendChild(card);
        });

        if (gsapOk && !reducedMotion) {
            gsap.fromTo(grid.children,
                { opacity: 0, y: 26 },
                {
                    opacity: 1, y: 0, duration: 0.7, stagger: 0.12, ease: 'power3.out',
                    scrollTrigger: { trigger: grid, start: 'top 88%', once: true },
                },
            );
        }
    }

    fetch(FS_BASE + '/web_cases?pageSize=50&key=' + API_KEY)
        .then(function (r) { return r.json(); })
        .then(function (json) {
            var cases = (json.documents || []).map(function (d) {
                var f = d.fields || {};
                return {
                    name: fv(f.name),
                    description: fv(f.description),
                    imageUrl: fv(f.imageUrl),
                    verticals: fv(f.verticals) || [],
                    order: fv(f.order) || 0
                };
            });
            cases.sort(function (a, b) { return a.order - b.order; });
            var featured = cases.filter(function (c) { return c.imageUrl; }).slice(0, 3);
            if (!featured.length) featured = cases.slice(0, 3);
            if (featured.length) {
                renderCases(featured);
            } else {
                var section = document.getElementById('casos');
                if (section) section.style.display = 'none';
            }
        })
        .catch(function () {
            // Sin datos: ocultamos la sección en vez de dejar esqueletos infinitos
            var section = document.getElementById('casos');
            if (section) section.style.display = 'none';
        });

    /* ────────────────────────────────
       FORMULARIO DE PRESCRIPCIÓN
    ──────────────────────────────── */
    var form = document.getElementById('lead-form');
    if (form) {
        form.addEventListener('submit', function (ev) {
            ev.preventDefault();
            var errorEl = document.getElementById('form-error');
            var successEl = document.getElementById('form-success');
            var submitBtn = document.getElementById('lead-submit');
            errorEl.classList.remove('visible');

            var data = {
                name: form.name.value.trim(),
                email: form.email.value.trim(),
                company: form.company.value.trim(),
                projectType: form.projectType.value,
                message: form.message.value.trim()
            };

            var emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(data.email);
            if (!data.name || !emailOk || !data.projectType) {
                errorEl.classList.add('visible');
                return;
            }

            submitBtn.disabled = true;
            submitBtn.style.opacity = '0.6';

            var fields = {
                name: { stringValue: data.name },
                email: { stringValue: data.email },
                projectType: { stringValue: data.projectType },
                source: { stringValue: 'landing' },
                createdAt: { timestampValue: new Date().toISOString() }
            };
            if (data.company) fields.company = { stringValue: data.company };
            if (data.message) fields.message = { stringValue: data.message };

            fetch(FS_BASE + '/web_leads?key=' + API_KEY, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fields: fields })
            })
                .then(function (r) {
                    if (!r.ok) throw new Error('HTTP ' + r.status);
                    form.reset();
                    successEl.classList.add('visible');
                    submitBtn.style.display = 'none';
                })
                .catch(function () {
                    errorEl.textContent = 'No se pudo enviar. Escríbenos a gaston@2n.com o inténtalo de nuevo.';
                    errorEl.classList.add('visible');
                })
                .finally(function () {
                    submitBtn.disabled = false;
                    submitBtn.style.opacity = '';
                });
        });
    }
})();
