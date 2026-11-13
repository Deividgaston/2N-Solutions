/**
 * 2N Presenter — Home v3 (landing editorial/cinemática)
 * - Coreografía GSAP + ScrollTrigger: reveal de líneas del hero, parallax,
 *   reveals. La navegación por perfiles y sectores no depende de la animación.
 *   Respeta prefers-reduced-motion (todo visible).
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
        grid.hidden = false;
        var fallback = document.getElementById('cases-fallback');
        if (fallback) fallback.hidden = true;
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

            var cta = document.createElement('span');
            cta.className = 'case-cta';
            cta.textContent = 'Ver proyecto \u27F6';
            body.appendChild(cta);

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

    // "Por qué 2N" editable desde Nexo (web_metadata/textos.why).
    // El contenido del HTML queda como fallback si el doc no existe.
    fetch(FS_BASE + '/web_metadata/textos?key=' + API_KEY)
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (docu) {
            var vals = docu && docu.fields && docu.fields.why && docu.fields.why.arrayValue && docu.fields.why.arrayValue.values;
            if (!vals || !vals.length) return;
            var rows = document.querySelectorAll('.why-list .why-row');
            vals.forEach(function (v, i) {
                var f = v.mapValue && v.mapValue.fields;
                if (!f || !rows[i]) return;
                var t = f.title && f.title.stringValue;
                var d = f.desc && f.desc.stringValue;
                var h3 = rows[i].querySelector('h3');
                var p = rows[i].querySelector('p');
                if (t && h3) h3.textContent = t;
                if (d && p) p.textContent = d;
            });
        })
        .catch(function () { /* estático como fallback */ });

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
                document.getElementById('cases-grid').hidden = true;
            }
        })
        .catch(function () {
            // El enlace a las referencias sigue disponible cuando no llegan los datos.
            document.getElementById('cases-grid').hidden = true;
        });

    /* ────────────────────────────────
       FORMULARIO DE PRESCRIPCIÓN
    ──────────────────────────────── */
    var form = document.getElementById('lead-form');
    if (form) {
        var selector = form.elements.namedItem('projectType');
        var params = new URLSearchParams(window.location.search);
        var origins = ['solucion-bts', 'solucion-btr', 'solucion-oficinas',
            'solucion-hoteles', 'solucion-seguridad', 'productos', 'casos-exito'];
        var origin = params.get('origen');
        var source = origins.indexOf(origin) >= 0 ? origin : 'landing';
        var requested = params.get('perfil') || params.get('tipo');
        var sending = false;

        function selectProject(value) {
            var option = Array.from(selector.options).find(function (opt) {
                return opt.value === value && !opt.disabled;
            });
            if (option) selector.value = option.value;
        }
        selectProject(requested);

        document.querySelectorAll('[data-lead-profile]').forEach(function (link) {
            link.addEventListener('click', function (ev) {
                if (ev.button !== 0 || ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.altKey) return;
                ev.preventDefault();
                selectProject(link.dataset.leadProfile);
                form.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'center' });
                form.elements.namedItem('name').focus({ preventScroll: true });
            });
        });

        form.addEventListener('submit', function (ev) {
            ev.preventDefault();
            if (sending) return;
            var errorEl = document.getElementById('form-error');
            var successEl = document.getElementById('form-success');
            var submitBtn = document.getElementById('lead-submit');
            errorEl.classList.remove('visible');
            successEl.classList.remove('visible');
            errorEl.textContent = 'Revisa el nombre, el email y el perfil o tipo de proyecto.';

            var data = {};
            ['name', 'email', 'company', 'projectType', 'message'].forEach(function (key) {
                data[key] = form.elements.namedItem(key).value.trim();
            });
            var emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(data.email);
            var knownProject = Array.from(selector.options).some(function (opt) {
                return opt.value === data.projectType && !opt.disabled;
            });
            var limits = { name: 200, email: 200, company: 200, projectType: 50, message: 2000 };
            var lengthsOk = Object.keys(limits).every(function (key) {
                return data[key].length <= limits[key];
            });
            if (!data.name || !emailOk || !knownProject || !lengthsOk || !form.checkValidity()) {
                errorEl.classList.add('visible');
                form.reportValidity();
                return;
            }

            sending = true;
            submitBtn.disabled = true;
            form.setAttribute('aria-busy', 'true');

            // El contrato público de web_leads admite exactamente estos siete campos.
            var fields = {
                name: { stringValue: data.name },
                email: { stringValue: data.email },
                projectType: { stringValue: data.projectType },
                source: { stringValue: source },
                createdAt: { timestampValue: new Date().toISOString() }
            };
            if (data.company) fields.company = { stringValue: data.company };
            if (data.message) fields.message = { stringValue: data.message };

            var controller = new AbortController();
            var requestTimeout = setTimeout(function () { controller.abort(); }, 12000);
            fetch(FS_BASE + '/web_leads?key=' + API_KEY, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                signal: controller.signal,
                body: JSON.stringify({ fields: fields })
            })
                .then(function (r) {
                    if (!r.ok) throw new Error('HTTP ' + r.status);
                    form.reset();
                    successEl.classList.add('visible');
                    submitBtn.hidden = true;
                })
                .catch(function () {
                    errorEl.textContent = 'No se pudo confirmar el envío. Escríbenos a gaston@2n.com o inténtalo de nuevo.';
                    errorEl.classList.add('visible');
                })
                .finally(function () {
                    clearTimeout(requestTimeout);
                    sending = false;
                    submitBtn.disabled = false;
                    form.setAttribute('aria-busy', 'false');
                });
        });
    }
})();
