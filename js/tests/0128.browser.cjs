// Recorrido reproducible sin red. Usa Playwright ya instalado; nunca accede a Firebase real.
// PLAYWRIGHT_MODULE_PATH=/ruta/a/playwright timeout 2m node js/tests/0128.browser.cjs
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE_PATH || 'playwright');
const root = path.resolve(__dirname, '../..');
const artifacts = process.env.NEXO_0128_ARTIFACTS || '/tmp/nexo-0128-e2e';
const origin = 'http://nexo-0128.test';
const pages = ['index.html', 'solucion-bts.html', 'solucion-btr.html', 'solucion-oficinas.html',
    'solucion-hoteles.html', 'solucion-seguridad.html', 'productos.html', 'casos-exito.html'];
const fixture = `
const product = { id: 'producto-prueba', name: 'Equipo de prueba', category: 'intercom', description: 'Datos ficticios', imageUrl: 'assets/innovation_bg.jpg', tags: ['IP'] };
const project = { id: 'caso-prueba', name: 'Proyecto de prueba', description: 'Datos ficticios', verticals: ['bts'], imageUrl: 'assets/innovation_bg.jpg', items: [] };
export const contentService = {
    getSections: async () => [{ title: 'Sección de prueba', text: 'Contenido ficticio', imageUrl: 'assets/innovation_bg.jpg' }],
    getVerticalMeta: async () => ({ heroTitle: 'Título remoto de prueba', heroSubtitle: 'Contenido ficticio', introTitle: 'Introducción de prueba' }),
    getGlobalProductsByVertical: async () => [product], getGlobalCasesByVertical: async () => [project],
    getAllProducts: async () => [product], getAllGlobalCases: async () => [project]
};`;
(async () => {
    await fs.mkdir(artifacts, { recursive: true });
    const browser = await chromium.launch({ headless: true });
    let checked = 0;
    try {
        for (const width of [320, 390, 1440]) {
            const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
            const errors = [], posts = [];
            let offline = false, failPost = false;
            await context.route('**/*', async route => {
                const request = route.request(), url = new URL(request.url());
                if (url.hostname === 'firestore.googleapis.com') {
                    if (request.method() === 'POST') {
                        posts.push(JSON.parse(request.postData()));
                        return route.fulfill({ status: failPost ? 403 : 200, contentType: 'application/json', body: '{}' });
                    }
                    if (offline) return route.abort();
                    const body = url.pathname.endsWith('/web_cases') ? { documents: [{ fields: {
                        name: { stringValue: 'Proyecto ficticio' }, description: { stringValue: 'Datos de prueba' },
                        imageUrl: { stringValue: 'assets/innovation_bg.jpg' }, verticals: { arrayValue: { values: [{ stringValue: 'bts' }] } }
                    } }] } : {};
                    return route.fulfill({ contentType: 'application/json', body: JSON.stringify(body) });
                }
                if (url.origin !== origin) {
                    // SDK/CDNs/fontes se sustituyen: se verifica la interfaz sin terceros.
                    return route.fulfill({ contentType: request.resourceType() === 'script' ? 'application/javascript' : 'text/css', body: '' });
                }
                if (url.pathname === '/js/services/content.service.js') {
                    return route.fulfill({ contentType: 'application/javascript', body: offline
                        ? `export const contentService = new Proxy({}, { get: () => async () => { throw new Error('offline de prueba'); } });`
                        : fixture });
                }
                if (['/js/firebase-init.js', '/js/pdf-handler.js'].includes(url.pathname)) {
                    return route.fulfill({ contentType: 'application/javascript', body: 'export const db = {};' });
                }
                const target = path.resolve(root, '.' + (url.pathname === '/' ? '/index.html' : url.pathname));
                if (!target.startsWith(root + path.sep)) return route.abort();
                const types = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml' };
                try { return await route.fulfill({ contentType: types[path.extname(target)], body: await fs.readFile(target) }); }
                catch { return route.fulfill({ status: 404, body: 'Recurso local no encontrado' }); }
            });
            const page = await context.newPage();
            page.on('pageerror', error => errors.push(error.message));
            for (const file of pages) {
                await page.goto(`${origin}/${file}`, { waitUntil: 'networkidle' });
                assert.equal(await page.locator('h1').count(), 1);
                assert.equal(await page.locator('a[href$="solucion-retail.html"]:visible').count(), 0);
                const invalidImages = await page.locator('img').evaluateAll(async images => {
                    images.forEach(img => { img.loading = 'eager'; });
                    await Promise.all(images.map(img => img.decode().catch(() => {})));
                    return images.filter(img => !img.hasAttribute('alt') || (img.offsetWidth && !img.naturalWidth)).length;
                });
                assert.equal(invalidImages, 0, `${file}: imágenes rotas o sin alt`);
                assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${file}: desborde`);
                const overflow = await page.locator('h1, h2, .profile-card a, .solution-actions a').evaluateAll(nodes => nodes.some(node => {
                    const box = node.getBoundingClientRect(); return box.width && (box.left < 0 || box.right > innerWidth + 1);
                }));
                assert.equal(overflow, false, `${file}: titular o CTA fuera del viewport`);
                await page.screenshot({ path: path.join(artifacts, `${file.replace('.html','')}-${width}.png`), fullPage: true });
                checked++;
            }
            await page.goto(`${origin}/index.html`, { waitUntil: 'networkidle' });
            for (const profile of ['arquitectura', 'ingenieria', 'promotora']) {
                await page.locator(`.profile-card [data-lead-profile="${profile}"]`).click();
                assert.equal(await page.locator('[name="projectType"]').inputValue(), profile);
            }
            await page.locator('[name="name"]').fill('Persona ficticia');
            await page.locator('[name="email"]').fill('prueba@example.test');
            await page.locator('#lead-submit').click();
            await page.locator('#form-success.visible').waitFor();
            assert.equal(posts.length, 1);
            assert.deepEqual(Object.keys(posts[0].fields).sort(), ['createdAt','email','name','projectType','source'].sort());
            assert.equal(posts[0].fields.projectType.stringValue, 'promotora');
            if (width < 768) {
                await page.locator('.mobile-menu-btn').click();
                await page.locator('.nav-links a').first().click();
                assert.equal(await page.locator('body.mobile-open').count(), 0);
            }
            failPost = true;
            await page.goto(`${origin}/index.html?tipo=office&origen=solucion-oficinas#contacto`, { waitUntil: 'networkidle' });
            assert.equal(await page.locator('[name="projectType"]').inputValue(), 'office');
            await page.locator('[name="name"]').fill('Persona ficticia');
            await page.locator('[name="email"]').fill('prueba@example.test');
            await page.locator('#lead-submit').click();
            await page.locator('#form-error.visible').waitFor();
            assert.equal(await page.locator('#lead-submit').isEnabled(), true);
            assert.equal(posts[1].fields.source.stringValue, 'solucion-oficinas');
            offline = true;
            for (const file of pages.filter(p => p.startsWith('solucion-'))) {
                await page.goto(`${origin}/${file}`, { waitUntil: 'networkidle' });
                assert.notEqual((await page.locator('h1').textContent()).trim(), '...');
                assert.match(await page.locator('#content-status').textContent(), /No se ha podido cargar/);
            }
            await page.screenshot({ path: path.join(artifacts, `respaldo-${width}.png`), fullPage: true });
            assert.deepEqual(errors, [], 'Errores JavaScript');
            await context.close();
        }
        console.log(`PASS · ${checked} páginas/anchos + perfiles, formulario, menú y respaldos · capturas: ${artifacts}`);
    } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
