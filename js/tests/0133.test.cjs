'use strict';
// Pruebas del encargo 0133 (node:test, sin dependencias): node --test js/tests/0133.test.cjs
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const ROOT = path.resolve(__dirname, '..', '..');
const BASE = '0a8f5a71d2f47e04effd25ed85e3455d3f2e922a';
const NEW = require(path.join(ROOT, 'js', 'configurador.js'));

function cargarBase() {
    const g = spawnSync('git', ['show', BASE + ':js/configurador.js'], { cwd: ROOT, encoding: 'utf8', maxBuffer: 1 << 26 });
    if (g.status !== 0) return null;
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cz0133-'));
    const f = path.join(dir, 'configurador-base.cjs');
    fs.writeFileSync(f, g.stdout);
    return require(f);
}

const OLD = cargarBase();

function excel(C, t, mod, lv) {
    const v = Object.assign(C.defaults(t), mod || {});
    const r = C.compute(t, v, lv).r;
    return Buffer.from(C.xlsxBytes(r, t, v, lv, '16/11/2026'));
}

const CASOS = [
    ['BTS estándar, 40 viviendas', 'bts', { viv: 40 }, 1],
    ['hotel desatendido', 'hot', { des: true }, 1]
];

CASOS.forEach(([nombre, t, mod, lv]) => {
    test('Excel idéntico byte a byte a 0a8f5a7: ' + nombre, { skip: !OLD && 'sin acceso a git show del SHA base' }, () => {
        assert.ok(NEW.CZ[t], 'vertical ' + t + ' existe');
        const a = excel(OLD, t, mod, lv), b = excel(NEW, t, mod, lv);
        assert.ok(a.length > 1000);
        assert.ok(a.equals(b));
    });
});

test('la lista incluye el botón plegable con aria-expanded y la descripción completa', () => {
    const v = NEW.defaults('bts');
    const r = NEW.compute('bts', v, 1).r;
    const z = r.Z[0];
    const h = NEW.zonaHtml(z, 1, 1, 0);
    assert.match(h, /<button class="cz-tg" type="button" aria-expanded="false" aria-controls="czd0">Ver descripción de partida<\/button>/);
    assert.ok(h.includes('<p class="cz-desc" id="czd0">' + z.desc + '</p>'));
    assert.ok(h.indexOf('class="r"') < h.indexOf('class="d"') && h.indexOf('class="d"') < h.indexOf('class="qq"'));
});

test('el CSS plega la descripción solo en ≤ 600 px y fija 44 px de alto', () => {
    const css = fs.readFileSync(path.join(ROOT, 'css', 'configurador.css'), 'utf8');
    const bloque = css.slice(css.indexOf('max-width: 600px'));
    assert.match(bloque, /\.cz-zone:not\(\.open\) \.cz-desc \{ display: none; \}/);
    assert.match(css, /\.cz-tg \{ display: none; \}/);
    assert.match(css, /\.cz-lvsw button \{ min-height: 44px; \}/);
    assert.match(css, /\.lnk\[data-cz\] \{ min-height: 44px;/);
    assert.match(fs.readFileSync(path.join(ROOT, 'productos.html'), 'utf8'), /\.filter-btn \{ min-height: 44px; \}/);
});
