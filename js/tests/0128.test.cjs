// Sin red ni dependencias: ejecuta los controladores reales con un DOM mínimo.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const settle = () => new Promise(resolve => setImmediate(resolve));
const verticals = ['bts', 'btr', 'oficinas', 'hoteles', 'seguridad'];

function element(value = '') {
    const classes = new Set();
    return {
        value, textContent: '', innerHTML: '', hidden: false, style: {}, attributes: {}, children: [], handlers: {}, dataset: {},
        classList: { add: x => classes.add(x), remove: x => classes.delete(x), contains: x => classes.has(x),
            toggle(x, on) { if (on) classes.add(x); else classes.delete(x); } },
        setAttribute(k, v) { this.attributes[k] = v; if (k === 'hidden') this.hidden = true; },
        addEventListener(k, cb) { this.handlers[k] = cb; },
        appendChild(el) { this.children.push(el); },
        insertAdjacentHTML(_, html) { this.innerHTML += html; },
        focus() { this.focused = true; }, scrollIntoView() { this.scrolled = true; },
        querySelector() { return null; }, querySelectorAll() { return []; }, remove() { this.removed = true; }
    };
}
function home(search = '', response = { ok: true }) {
    const nodes = Object.fromEntries(['lead-form', 'form-error', 'form-success', 'lead-submit', 'cases-grid', 'cases-fallback'].map(k => [k, element()]));
    nodes['cases-grid'].hidden = true;
    const inputs = Object.fromEntries(['name', 'email', 'company', 'projectType', 'message'].map(k => [k, element()]));
    Object.assign(inputs.name, { value: ' Persona de prueba ' });
    inputs.email.value = ' prueba@example.test ';
    inputs.projectType.value = 'bts';
    inputs.projectType.options = [...read('index.html').matchAll(/<option value="([^"]*)"([^>]*)>/g)]
        .map(m => ({ value: m[1], disabled: m[2].includes('disabled') }));
    const form = nodes['lead-form'];
    form.elements = { namedItem: k => inputs[k] };
    form.checkValidity = () => true;
    form.reportValidity = () => { form.reported = true; };
    form.reset = () => { form.resetCalled = true; };
    const links = ['arquitectura', 'ingenieria', 'promotora'].map(profile => Object.assign(element(), { dataset: { leadProfile: profile } }));
    const posts = [], gets = [], timers = new Map();
    const document = { getElementById: id => nodes[id], querySelectorAll: s => s === '[data-lead-profile]' ? links : [], createElement: () => element() };
    const context = { document, window: { location: { search }, matchMedia: () => ({ matches: true }) },
        URLSearchParams, AbortController, console, Date, Array,
        setTimeout(cb) { timers.set(1, cb); return 1; }, clearTimeout(id) { timers.delete(id); },
        fetch(url, options) {
            if (!options) { gets.push(url); return Promise.resolve({ ok: true, json: async () => ({ documents: [] }) }); }
            posts.push({ url, ...options });
            if (typeof response === 'function') return response(options);
            return response instanceof Error ? Promise.reject(response) : Promise.resolve(response);
        }
    };
    vm.runInNewContext(read('js/home.js'), context);
    return { nodes, inputs, links, posts, gets, timers, submit: () => form.handlers.submit({ preventDefault() {} }) };
}

test('los tres perfiles llevan al formulario incluso sin JS', () => {
    const html = read('index.html');
    for (const profile of ['arquitectura', 'ingenieria', 'promotora']) {
        assert.match(html, new RegExp(`href="\\?perfil=${profile}#contacto"`));
    }
    assert.equal((html.match(/class="profile-card"/g) || []).length, 3);
});
for (const [query, expected] of [['?perfil=arquitectura', 'arquitectura'], ['?perfil=ingenieria', 'ingenieria'], ['?perfil=promotora', 'promotora'], ['?tipo=office', 'office'], ['?tipo=security', 'security']]) {
    test(`preselección ${query}`, () => assert.equal(home(query).inputs.projectType.value, expected));
}
test('un perfil desconocido no se introduce en el selector', () => assert.equal(home('?perfil=no-admitido').inputs.projectType.value, 'bts'));
test('CTA de perfil selecciona el perfil, muestra y enfoca el formulario', () => {
    const app = home();
    let prevented = false;
    app.links[1].handlers.click({ button: 0, preventDefault() { prevented = true; } });
    assert.equal(app.inputs.projectType.value, 'ingenieria');
    assert.equal(app.inputs.name.focused, true);
    assert.equal(app.nodes['lead-form'].scrolled, true);
    assert.equal(prevented, true);
    app.links[0].handlers.click({ button: 0, ctrlKey: true, preventDefault() { assert.fail(); } });
    assert.equal(app.inputs.projectType.value, 'ingenieria');
});
test('envío válido con el contrato público de siete campos y límites', async () => {
    const app = home('?tipo=btr&origen=solucion-btr');
    app.inputs.company.value = ' Estudio de prueba ';
    app.inputs.message.value = ' Proyecto ficticio ';
    app.submit(); await settle();
    assert.equal(app.posts.length, 1);
    const post = app.posts[0];
    assert.equal(post.method, 'POST'); assert.match(post.url, /\/web_leads\?/);
    const { fields } = JSON.parse(post.body);
    assert.deepEqual(Object.keys(fields).sort(), ['name','email','company','projectType','message','source','createdAt'].sort());
    assert.equal(fields.name.stringValue, 'Persona de prueba');
    assert.equal(fields.email.stringValue, 'prueba@example.test');
    assert.equal(fields.source.stringValue, 'solucion-btr');
    assert.equal(fields.projectType.stringValue, 'btr');
    assert.ok(Number.isFinite(Date.parse(fields.createdAt.timestampValue)));
    for (const [key, max] of Object.entries({ name: 200, email: 200, company: 200, projectType: 50, message: 2000, source: 50 })) {
        assert.ok(fields[key].stringValue.length <= max);
    }
    assert.equal(app.nodes['lead-form'].resetCalled, true);
    assert.equal(app.nodes['form-success'].classList.contains('visible'), true);
    assert.equal(app.nodes['lead-submit'].hidden, true);
    assert.equal(app.timers.size, 0);
});
test('sin opcionales se envían únicamente los cinco campos obligatorios', async () => {
    const app = home('?origen=externo'); app.submit(); await settle();
    const { fields } = JSON.parse(app.posts[0].body);
    assert.equal(fields.source.stringValue, 'landing');
    assert.deepEqual(Object.keys(fields).sort(), ['name','email','projectType','source','createdAt'].sort());
});
for (const [field, value] of [['name',' '], ['email','incorrecto'], ['name','a'.repeat(201)], ['email','a'.repeat(201)+'@example.test'], ['company','a'.repeat(201)], ['projectType','no-admitido'], ['message','a'.repeat(2001)]]) {
    test(`no se envía ${field} inválido (${value.length} caracteres)`, async () => {
        const app = home(); app.inputs[field].value = value; app.submit(); await settle();
        assert.equal(app.posts.length, 0);
        assert.equal(app.nodes['form-error'].classList.contains('visible'), true);
    });
}
test('respeta también la validación nativa del formulario', async () => {
    const app = home(); app.nodes['lead-form'].checkValidity = () => false;
    app.submit(); await settle(); assert.equal(app.posts.length, 0); assert.equal(app.nodes['lead-form'].reported, true);
});
for (const response of [{ ok: false, status: 403 }, new Error('offline')]) {
    test(`error ${response.status || response.message}: conserva datos y permite reintento`, async () => {
        const app = home('', response); app.submit(); await settle();
        assert.equal(app.nodes['form-error'].classList.contains('visible'), true);
        assert.equal(app.nodes['form-success'].classList.contains('visible'), false);
        assert.equal(app.nodes['lead-form'].resetCalled, undefined);
        assert.equal(app.nodes['lead-submit'].disabled, false);
        assert.equal(app.timers.size, 0);
        app.inputs.email.value = 'mal'; app.submit();
        assert.match(app.nodes['form-error'].textContent, /^Revisa/);
    });
}
test('doble clic genera un solo POST y el timeout libera el formulario', async () => {
    const app = home('', options => new Promise((resolve, reject) => options.signal.addEventListener('abort', () => reject(new Error('AbortError')))));
    app.submit(); app.submit(); assert.equal(app.posts.length, 1);
    assert.equal(app.nodes['lead-submit'].disabled, true);
    app.timers.get(1)(); await settle();
    assert.equal(app.posts[0].signal.aborted, true);
    assert.equal(app.nodes['lead-submit'].disabled, false);
    assert.match(app.nodes['form-error'].textContent, /No se pudo confirmar/);
});
test('casos sin datos mantienen la vía a referencias sin inventar proyectos', async () => {
    const app = home(); await settle();
    assert.equal(app.nodes['cases-grid'].hidden, true);
    assert.equal(app.nodes['cases-fallback'].hidden, false);
    assert.equal(app.gets.length, 2);
    assert.match(app.gets[0], /\/web_metadata\/textos\?/);
    assert.match(app.gets[1], /\/web_cases\?pageSize=50/);
});

function renderer(service) {
    const nodes = { container: element(), status: element(), tech: element(), cases: element(), hero: element(), title: element(), subtitle: element() };
    nodes.container.innerHTML = 'contenido de respaldo';
    nodes.hero.querySelector = s => s === 'h1' ? nodes.title : s === '.solution-subtitle' ? nodes.subtitle : null;
    const query = { '.tech-section': nodes.tech, '.casos-section': nodes.cases, '.solution-hero': nodes.hero };
    const document = { getElementById: id => id === 'content-status' ? nodes.status : null,
        querySelector: s => query[s] || null, querySelectorAll: () => [], addEventListener() {}, createElement: () => element() };
    const code = read('js/vertical-renderer.js').replace(/^import .*;$/m, '') + '\nglobalThis.Renderer = VerticalRenderer;';
    const context = { document, contentService: service, console: { log() {}, error() {}, warn() {} },
        IntersectionObserver: class { observe() {} } };
    vm.runInNewContext(code, context);
    const instance = Object.assign(Object.create(context.Renderer.prototype), { container: nodes.container, verticalId: 'btr' });
    return { instance, nodes };
}
test('fallo de Firestore conserva respaldo y muestra un estado útil sin detalles internos', async () => {
    const reject = async () => { throw new Error('detalle interno no público'); };
    const app = renderer({ getSections: reject, getVerticalMeta: reject, getGlobalProductsByVertical: reject, getGlobalCasesByVertical: reject });
    await app.instance.init();
    assert.equal(app.nodes.container.innerHTML, 'contenido de respaldo');
    assert.match(app.nodes.status.textContent, /No se ha podido cargar/);
    assert.doesNotMatch(app.nodes.status.textContent, /detalle interno/);
    assert.equal(app.nodes.container.attributes['aria-busy'], 'false');
    assert.equal(app.nodes.tech.hidden, true); assert.equal(app.nodes.cases.hidden, true);
});
test('colecciones vacías: sin mensajes de administrador ni secciones vacías', async () => {
    const app = renderer({ getSections: async () => [], getVerticalMeta: async () => null,
        getGlobalProductsByVertical: async () => [], getGlobalCasesByVertical: async () => [] });
    await app.instance.init();
    assert.equal(app.nodes.container.innerHTML, 'contenido de respaldo');
    assert.equal(app.nodes.tech.hidden, true); assert.equal(app.nodes.cases.hidden, true);
    assert.match(app.nodes.status.textContent, /prescripción/);
});
test('la respuesta remota conserva prioridad y usa una imagen local si no trae foto', async () => {
    const calls = [];
    const get = (name, value) => async id => { calls.push([name,id]); return value; };
    const app = renderer({ getSections: get('sections', []), getVerticalMeta: get('meta', { heroTitle: 'Título remoto', heroSubtitle: 'Subtítulo remoto' }),
        getGlobalProductsByVertical: get('products', []), getGlobalCasesByVertical: get('cases', []) });
    await app.instance.init();
    assert.equal(app.nodes.title.textContent, 'Título remoto');
    assert.equal(app.nodes.subtitle.textContent, 'Subtítulo remoto');
    assert.match(app.nodes.hero.style.backgroundImage, /assets\/innovation_bg.jpg/);
    assert.deepEqual(calls, [['sections','btr'],['meta','btr'],['products','btr'],['cases','btr']]);
});

test('las cinco verticales tienen respaldo y CTA contextual sin Firestore', () => {
    for (const slug of verticals) {
        const html = read(`solucion-${slug}.html`);
        assert.doesNotMatch(html, /<(?:h1|h2|p)>\.\.\.<\//);
        assert.match(html, /class="benefit-card"/);
        assert.match(html, new RegExp(`index.html\\?tipo=[a-z]+&amp;origen=solucion-${slug}#contacto`));
        assert.match(html, /role="status"/);
    }
});
test('afirmaciones de respaldo dentro de las reglas de David', () => {
    const html = ['index.html','productos.html','casos-exito.html',...verticals.map(v => `solucion-${v}.html`)].map(read).join('\n');
    assert.doesNotMatch(html, /Full HD|IP65|reconocimiento facial|Sesame|TLS 1\.3|GDPR Compliant|cumplimiento GDPR|cumple (?:la normativa|EAA|CTE)/i);
    assert.match(html, /99,98 % de las llamadas que llegan a la app/);
    assert.match(html, /No está disponible en la manilla ni el cilindro Fortis/);
    assert.match(html, /Factorial o cualquier sistema con API abierta/);
});
test('Retail fuera de portada, formulario y menús de las páginas autorizadas', () => {
    for (const page of ['index.html','productos.html','casos-exito.html','solucion-retail.html',...verticals.map(v => `solucion-${v}.html`)]) {
        assert.doesNotMatch(read(page), /href="solucion-retail.html"/);
    }
    assert.doesNotMatch(read('index.html'), /value="retail"/);
    assert.match(read('css/theme.css'), /\.footer a\[href\$="solucion-retail\.html"\]/);
});
test('recursos locales referenciados por las páginas tocadas existen', () => {
    for (const file of ['index.html','productos.html','casos-exito.html',...verticals.map(v => `solucion-${v}.html`)]) {
        const html = read(file);
        for (const match of html.matchAll(/(?:src|href)="((?:assets|css|js)\/[^"?#]+)(?:[?#][^"]*)?"/g)) {
            assert.ok(fs.existsSync(path.join(root, match[1])), `${file}: ${match[1]}`);
        }
        for (const match of html.matchAll(/url\(['"]?(assets\/[^'"()]+)['"]?\)/g)) {
            assert.ok(fs.existsSync(path.join(root, match[1])), `${file}: fondo ${match[1]}`);
        }
        for (const match of html.matchAll(/<img\b[^>]*>/g)) assert.match(match[0], /\balt="[^"]*"/);
    }
});

test('menú móvil: estado accesible, cierre por enlace y Escape, Retail retirado', () => {
    const navbar = element(), body = element(), navigation = element();
    const retail = Object.assign(element(), { href: 'https://local.test/solucion-retail.html' });
    const solutions = Object.assign(element(), { href: 'https://local.test/#solutions' });
    navbar.querySelector = () => navigation;
    navbar.querySelectorAll = () => [solutions];
    const handlers = {};
    const document = { body, readyState: 'complete', createElement: () => element(),
        getElementById: id => id === 'navbar' ? navbar : null,
        querySelectorAll: () => [retail, solutions], addEventListener: (type, handler) => { handlers[type] = handler; } };
    vm.runInNewContext(read('js/nav-controller.js'), { document, URL, window: {
        location: { href: 'https://local.test/', origin: 'https://local.test' }, addEventListener() {}
    } });
    assert.equal(retail.removed, true); assert.equal(solutions.removed, undefined);
    const btn = navbar.children[0];
    assert.equal(btn.attributes['aria-expanded'], 'false');
    assert.equal(btn.attributes['aria-controls'], 'primary-navigation');
    btn.handlers.click();
    assert.equal(body.classList.contains('mobile-open'), true);
    assert.equal(btn.attributes['aria-expanded'], 'true');
    solutions.handlers.click();
    assert.equal(body.classList.contains('mobile-open'), false);
    assert.equal(btn.attributes['aria-expanded'], 'false');
    assert.match(btn.innerHTML, /line x1="3"/);
    btn.handlers.click(); handlers.keydown({ key: 'Escape' });
    assert.equal(body.classList.contains('mobile-open'), false);
    assert.equal(btn.focused, true);
});
test('las secciones sin foto no generan peticiones vacías y el alt preserva las comillas', () => {
    const app = renderer({});
    app.instance.renderSections([{ title: 'Texto sin imagen', tags: [] }]);
    assert.equal(app.nodes.container.children.length, 1);
    assert.doesNotMatch(app.nodes.container.children[0].innerHTML, /<img/);
    app.instance.renderSections([{ title: 'Equipo "2N"', imageUrl: 'assets/innovation_bg.jpg' }]);
    assert.match(app.nodes.container.children[1].innerHTML, /alt="Equipo &quot;2N&quot;"/);
});
