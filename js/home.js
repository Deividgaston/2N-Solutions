/**
 * 2N Presenter — Home (landing)
 * - Motion con GSAP + ScrollTrigger (respeta prefers-reduced-motion)
 * - Casos destacados desde Firestore (REST, sin SDK: la landing no carga Firebase)
 * - Formulario de prescripción -> colección web_leads (create público validado por reglas)
 */
(function () {
    'use strict';

    // Misma config que js/firebase-init.js (solo lectura pública + create de leads)
    var PROJECT = 'crm-obras-prod';
    var API_KEY = 'AIzaSyBdTl2XXdo9ks-qqhBqDdXk8uLb65qyD-I';
    var FS_BASE = 'https://firestore.googleapis.com/v1/projects/' + PROJECT + '/databases/(default)/documents';

    /* ────────────────────────────────
       MOTION (GSAP)
    ──────────────────────────────── */
    var gsapOk = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';
    if (gsapOk) {
        gsap.registerPlugin(ScrollTrigger);
        document.documentElement.classList.add('gsap-on');

        var mm = gsap.matchMedia();

        mm.add('(prefers-reduced-motion: no-preference)', function () {
            // Entrada del hero: cascada
            gsap.fromTo('.hero [data-reveal]',
                { opacity: 0, y: 24 },
                { opacity: 1, y: 0, duration: 0.9, stagger: 0.12, ease: 'power3.out', delay: 0.15 }
            );

            // Parallax suave de la foto del hero
            gsap.to('[data-parallax]', {
                yPercent: 8,
                ease: 'none',
                scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true }
            });

            // Reveals al hacer scroll (todo lo que no es hero)
            gsap.utils.toArray('section [data-reveal]').forEach(function (el) {
                gsap.fromTo(el,
                    { opacity: 0, y: 28 },
                    {
                        opacity: 1, y: 0, duration: 0.8, ease: 'power3.out',
                        scrollTrigger: { trigger: el, start: 'top 88%', once: true }
                    }
                );
            });

            // Count-up de la trust bar
            gsap.utils.toArray('[data-count]').forEach(function (el) {
                var target = parseInt(el.getAttribute('data-count'), 10);
                var obj = { v: 0 };
                gsap.to(obj, {
                    v: target,
                    duration: 1.4,
                    ease: 'power2.out',
                    scrollTrigger: { trigger: el, start: 'top 92%', once: true },
                    onUpdate: function () { el.textContent = Math.round(obj.v); }
                });
            });
        });

        mm.add('(prefers-reduced-motion: reduce)', function () {
            gsap.set('[data-reveal]', { opacity: 1, y: 0 });
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
        cases.forEach(function (c) {
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

        if (gsapOk && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            gsap.fromTo(grid.children,
                { opacity: 0, y: 24 },
                {
                    opacity: 1, y: 0, duration: 0.7, stagger: 0.1, ease: 'power3.out',
                    scrollTrigger: { trigger: grid, start: 'top 88%', once: true }
                }
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
