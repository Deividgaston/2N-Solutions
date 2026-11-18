'use strict';
// Pruebas del encargo 0147 (node:test, sin dependencias): node --test js/tests/0147.test.cjs
// Quitar un capítulo o una partida en el resultado del configurador, y recuperarlos.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const ROOT = path.resolve(__dirname, '..', '..');
const BASE = '7919ab43a697c33ac32b4f2e67196622b362cea0';
const C = require(path.join(ROOT, 'js', 'configurador.js'));

function cargarBase() {
    const g = spawnSync('git', ['show', BASE + ':js/configurador.js'], { cwd: ROOT, encoding: 'utf8', maxBuffer: 1 << 26 });
    if (g.status !== 0) return null;
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cz0147-'));
    const f = path.join(dir, 'configurador-base.cjs');
    fs.writeFileSync(f, g.stdout);
    return require(f);
}
const OLD = cargarBase();

const FECHA = '18/11/2026';
const hecho = (n, q, t, mod, lv) => {
    const v = Object.assign(C.defaults(t), mod || {});
    const o = C.compute(t, v, lv, q);
    return { v, o, excel: Buffer.from(C.xlsxBytes(o.r, t, v, lv, FECHA)), lead: C.resumenLead(t, v, lv, o.r, o.c, C.textoQuitados(o.full, q || [])) };
};
/* Texto de las celdas del Excel (el zip va sin compresión). */
const celdas = (buf) => [...buf.toString('utf8').matchAll(/<t xml:space="preserve">([^<]*)<\/t>/g)].map(m => m[1]);
const codigos = (buf) => celdas(buf).filter(c => /^\d\d(\.\d\d)?$/.test(c));

function todas() {
    const out = [];
    C.ORDER.forEach(t => [0, 1, 2].forEach(lv => {
        const base = C.defaults(t), off = {}, on = {};
        Object.keys(base).forEach(k => { off[k] = typeof base[k] === 'boolean' ? false : base[k]; on[k] = typeof base[k] === 'boolean' ? true : base[k]; });
        out.push([t, base, lv], [t, off, lv], [t, on, lv]);
    }));
    return out;
}
/* Coste de una partida sola: equipos + red, para comprobar lo que baja al quitarla. */
const costeSolo = (z, t, v) => { const c = C.coste({ Z: [z], A: [] }, t, v).A; return c.eq + c.red; };

// ── 1. Sin quitar nada, todo sale idéntico a 7919ab4 ──
test('sin quitar nada: partidas, notas, coste, Excel y lead idénticos a 7919ab4 (todos los verticales y niveles)', { skip: !OLD && 'sin acceso a git show del SHA base' }, () => {
    todas().forEach(([t, v, lv]) => {
        const a = OLD.compute(t, JSON.parse(JSON.stringify(v)), lv), b = C.compute(t, JSON.parse(JSON.stringify(v)), lv), b2 = C.compute(t, JSON.parse(JSON.stringify(v)), lv, []);
        assert.deepEqual(b.r, a.r, 'partidas ' + t + lv);
        assert.deepEqual(b2.r, a.r);
        assert.deepEqual(b.c, a.c, 'coste ' + t + lv);
        const x1 = Buffer.from(OLD.xlsxBytes(a.r, t, v, lv, FECHA)), x2 = Buffer.from(C.xlsxBytes(b.r, t, v, lv, FECHA));
        assert.ok(x1.equals(x2), 'Excel ' + t + lv);
        assert.equal(C.resumenLead(t, v, lv, b.r, b.c), OLD.resumenLead(t, v, lv, a.r, a.c), 'lead ' + t + lv);
        assert.equal(C.resumenLead(t, v, lv, b.r, b.c, ''), OLD.resumenLead(t, v, lv, a.r, a.c));
        assert.ok(!/Quitado por el cliente/.test(C.resumenLead(t, v, lv, b.r, b.c)));
        assert.equal(JSON.stringify(C.leadFields({ name: 'A', email: 'a@b.invalid' }, t, v, lv, b.r, b.c)).replace(/"createdAt":\{[^}]*\},?/, '').replace(',}', '}'),
            JSON.stringify(OLD.leadFields({ name: 'A', email: 'a@b.invalid' }, t, v, lv, a.r, a.c)).replace(/"createdAt":\{[^}]*\},?/, '').replace(',}', '}'));
    });
});

test('la clave de cada partida (capítulo + descripción) es única en todas las configuraciones', () => {
    todas().forEach(([t, v, lv]) => {
        const r = C.compute(t, v, lv).r, ks = r.Z.map(C.kPart);
        assert.equal(new Set(ks).size, ks.length, 'claves repetidas en ' + t + lv);
    });
});

// ── 2. Quitar un capítulo y una partida cambia coste, Excel y lead ──
test('quitar un capítulo (Gestión) y una partida suelta cambia el coste, el Excel y el lead', () => {
    const ini = hecho(0, [], 'btr', {}, 1);
    const gest = ini.o.r.Z.filter(z => z.n === 'Gestión');
    assert.equal(gest.length, 1);
    assert.equal(gest[0].part, 'Servidor de gestión de accesos');

    // capítulo entero
    const q1 = [C.kCap('Gestión')], a = hecho(0, q1, 'btr', {}, 1);
    assert.ok(a.o.r.Z.every(z => z.n !== 'Gestión'));
    assert.equal(ini.o.c.A.eq + ini.o.c.A.red - (a.o.c.A.eq + a.o.c.A.red), costeSolo(gest[0], 'btr', ini.v));
    assert.ok(a.o.c.totA < ini.o.c.totA && a.o.c.totB < ini.o.c.totB);
    assert.ok(celdas(ini.excel).includes('SERVIDOR DE GESTIÓN DE ACCESOS') && !celdas(a.excel).includes('SERVIDOR DE GESTIÓN DE ACCESOS'));
    assert.ok(!celdas(a.excel).includes('1120120E') && celdas(ini.excel).includes('1120120E'));
    assert.match(a.lead, / Quitado por el cliente: capítulo Gestión\.$/);
    assert.ok(!/Quitado por el cliente/.test(ini.lead));
    // el lead cuenta menos referencias y unidades que el completo
    assert.notEqual(a.lead.match(/Total: [^.]*\./)[0], ini.lead.match(/Total: [^.]*\./)[0]);

    // partida suelta: el relé de seguridad
    const rele = ini.o.r.Z.find(z => z.part === 'Relé de seguridad'), q2 = [C.kPart(rele)], b = hecho(0, q2, 'btr', {}, 1);
    assert.equal(b.o.r.Z.length, ini.o.r.Z.length - 1);
    assert.ok(b.o.r.Z.every(z => z.part !== 'Relé de seguridad'));
    assert.equal(ini.o.c.A.eq + ini.o.c.A.red - (b.o.c.A.eq + b.o.c.A.red), costeSolo(rele, 'btr', ini.v));
    assert.ok(!celdas(b.excel).includes('RELÉ DE SEGURIDAD') && celdas(ini.excel).includes('RELÉ DE SEGURIDAD'));
    assert.match(b.lead, /Quitado por el cliente: partida Relé de seguridad \(Seguridad\)\.$/);

    // los dos a la vez
    const c = hecho(0, q1.concat(q2), 'btr', {}, 1);
    // en el orden en que salen en el resultado (Seguridad va antes que Gestión)
    assert.match(c.lead, /Quitado por el cliente: partida Relé de seguridad \(Seguridad\); capítulo Gestión\.$/);
    assert.equal(c.o.r.Z.length, ini.o.r.Z.length - 2);
});

test('la suscripción My2N y la columna «solo app» siguen la partida de monitores', () => {
    const ini = hecho(0, [], 'bts', {}, 1);
    const sin = hecho(0, [C.kCap('Viviendas')], 'bts', {}, 1);
    assert.ok(ini.o.c.B && ini.o.c.B.lic > 0);
    assert.equal(sin.o.c.B, null, 'sin monitores no hay variante «solo app»');
    assert.equal(sin.o.c.div, 0);
    assert.match(sin.lead, /Coste orientativo a PVP: [\d.]+ €\. Quitado/);
    assert.ok(!/solo app/.test(sin.lead));
});

// ── 3. Recuperar deja todo como al principio ──
test('recuperar deja exactamente lo mismo que sin quitar: coste, filas del Excel y lead', () => {
    C.ORDER.forEach(t => {
        const ini = hecho(0, [], t, {}, 1), qs = C.qNuevo(), f = C.firma(t, ini.v, 1);
        const zs = ini.o.r.Z, caps = [...new Set(zs.map(z => z.n))];
        C.qQuitar(qs, C.kCap(caps[0]), f);
        C.qQuitar(qs, C.kPart(zs[zs.length - 1]), f);
        const mid = hecho(0, qs.k, t, {}, 1);
        assert.notDeepEqual(mid.o.c, ini.o.c);
        assert.ok(!mid.excel.equals(ini.excel));
        // recuperar uno a uno
        C.elementosQuitados(mid.o.full, qs.k).forEach(e => C.qRecuperar(qs, e.k));
        assert.deepEqual(qs.k, []);
        const fin = hecho(0, qs.k, t, {}, 1);
        assert.deepEqual(fin.o.c, ini.o.c);
        assert.deepEqual(fin.o.r, ini.o.r);
        assert.ok(fin.excel.equals(ini.excel));
        assert.equal(fin.lead, ini.lead);
        // y con «Recuperar todo»
        C.qQuitar(qs, C.kCap(caps[0]), f); C.qTodo(qs);
        assert.ok(hecho(0, qs.k, t, {}, 1).excel.equals(ini.excel));
    });
});

test('quitar un capítulo conserva las partidas sueltas ya quitadas dentro de él', () => {
    const ini = hecho(0, [], 'btr', {}, 1), garaje = ini.o.r.Z.filter(z => z.n === 'Garaje');
    assert.equal(garaje.length, 2);
    const qs = C.qNuevo(), f = C.firma('btr', ini.v, 1);
    C.qQuitar(qs, C.kPart(garaje[1]), f); C.qQuitar(qs, C.kCap('Garaje'), f);
    assert.equal(hecho(0, qs.k, 'btr', {}, 1).o.r.Z.filter(z => z.n === 'Garaje').length, 0);
    assert.deepEqual(C.elementosQuitados(ini.o.full, qs.k).map(e => e.k), [C.kCap('Garaje')]);
    C.qRecuperar(qs, C.kCap('Garaje'));
    const d = hecho(0, qs.k, 'btr', {}, 1);
    assert.deepEqual(d.o.r.Z.filter(z => z.n === 'Garaje').map(z => z.part), [garaje[0].part]);
});

// ── 4. La numeración se rehace sin huecos (en pantalla y en el Excel) ──
const numeros = (h) => [...h.matchAll(/<h4 class="cz-cap">(\d\d) · ([^<]*)<\/h4>|<span class="cz-code">(\d\d\.\d\d)<\/span>/g)].map(m => m[1] || m[3]);
test('la numeración se rehace sin huecos al quitar el primer capítulo, uno intermedio o una partida', () => {
    const ini = hecho(0, [], 'btr', {}, 1), caps = [...new Set(ini.o.r.Z.map(z => z.n))];
    assert.deepEqual(caps.slice(0, 2), ['Portales', 'Garaje']);
    const esperada = (r) => { const out = []; let c = 0, p = 0, cap = null; r.Z.forEach(z => { if (z.n !== cap) { cap = z.n; c++; p = 0; out.push(('0' + c).slice(-2)); } p++; out.push(('0' + c).slice(-2) + '.' + ('0' + p).slice(-2)); }); return out; };
    [[C.kCap('Portales')], [C.kCap('Garaje')], [C.kPart(ini.o.r.Z.find(z => z.part === 'Control de acceso a la entrada del garaje'))], [C.kCap('Gestión'), C.kCap('Portales')]].forEach(q => {
        const h = hecho(0, q, 'btr', {}, 1), r = h.o.r;
        const html = C.listaHtml(r, h.o.full, q, false), esp = esperada(r);
        assert.deepEqual(numeros(html), esp);
        assert.deepEqual(codigos(h.excel), esp, 'numeración del Excel');
        assert.ok(esp.length < esperada(ini.o.r).length);
        const caps2 = esp.filter(x => x.length === 2);
        assert.deepEqual(caps2, caps2.map((_, i) => ('0' + (i + 1)).slice(-2)), 'capítulos seguidos');
    });
    // sin el primer capítulo, el siguiente pasa a ser 01
    const h = hecho(0, [C.kCap('Portales')], 'btr', {}, 1);
    assert.match(C.listaHtml(h.o.r, h.o.full, [C.kCap('Portales')], false), /<h4 class="cz-cap">01 · Garaje<\/h4>/);
});

// ── 5. Botones con texto accesible, y línea «Has quitado» ──
test('cada capítulo y cada partida llevan su botón de quitar con texto accesible, y «Has quitado» un Recuperar por elemento y otro para todo', () => {
    const ini = hecho(0, [], 'btr', {}, 1), html = C.listaHtml(ini.o.r, ini.o.full, [], false);
    assert.match(html, /<button class="cz-rm" type="button" data-rm="c\|Gestión" aria-label="Quitar capítulo Gestión"/);
    assert.match(html, /<button class="cz-rm" type="button" data-rm="p\|Gestión\|Servidor de gestión de accesos" aria-label="Quitar partida Servidor de gestión de accesos"/);
    assert.equal(html.split('class="cz-rm"').length - 1, new Set(ini.o.r.Z.map(z => z.n)).size + ini.o.r.Z.length);
    assert.ok(!/Has quitado/.test(html));
    const q = [C.kCap('Gestión')], h1 = hecho(0, q, 'btr', {}, 1), t1 = C.listaHtml(h1.o.r, h1.o.full, q, false);
    assert.match(t1, /Has quitado:<\/span><span class="cz-qi"><span>Capítulo Gestión<\/span><button class="cz-rec" type="button" data-rec="c\|Gestión" aria-label="Recuperar capítulo Gestión">Recuperar<\/button>/);
    assert.ok(!/Recuperar todo/.test(t1), 'con uno solo no hace falta «Recuperar todo»');
    const q2 = q.concat(C.kPart(ini.o.r.Z.find(z => z.part === 'Relé de seguridad'))), h2 = hecho(0, q2, 'btr', {}, 1), t2 = C.listaHtml(h2.o.r, h2.o.full, q2, false);
    assert.equal(t2.split('data-rec="').length - 1, 3);
    assert.match(t2, /data-rec="\*">Recuperar todo<\/button>/);
    assert.match(t2, /Partida Relé de seguridad/);
    // la partida recuperada vuelve a llevar su botón de quitar
    assert.ok(!/data-rm="c\|Gestión"/.test(t1));
});

test('la nota del cilindro Fortis solo sale mientras haya cilindros, y la de My2N no habla de monitores si se quitan', () => {
    const smk = { smk: true };
    const ini = hecho(0, [], 'btr', smk, 1);
    assert.ok(ini.o.r.A.some(a => /cilindro Fortis/.test(a)) && ini.o.c.fortis);
    const sin = hecho(0, [C.kPart(ini.o.r.Z.find(z => z.part.indexOf('Cerradura inteligente') === 0))], 'btr', smk, 1);
    assert.ok(!sin.o.r.A.some(a => /Fortis/.test(a)) && !sin.o.c.fortis);
    assert.ok(sin.o.r.A.some(a => /PoE/.test(a)));
    // BTS: la gestión va con My2N y «con monitor en la vivienda…» solo mientras exista la partida de monitores
    const bts = hecho(0, [], 'bts', {}, 1);
    assert.ok(bts.o.r.A.some(a => /con monitor en la vivienda/.test(a)));
    const sm = hecho(0, [C.kCap('Viviendas')], 'bts', {}, 1);
    assert.ok(sm.o.r.A.some(a => a === 'La gestión va con My2N, la plataforma en la nube de 2N.'));
    assert.ok(!sm.o.r.A.some(a => /monitor/.test(a)));
    // manillas Fortis en hotel
    const hot = hecho(0, [], 'hot', {}, 1);
    assert.ok(hot.o.r.A.some(a => /manillas Fortis/.test(a)));
    assert.ok(!hecho(0, [C.kCap('Habitaciones')], 'hot', {}, 1).o.r.A.some(a => /manillas Fortis/.test(a)));
});

// ── 6. Quitar todo desactiva el Excel y el envío ──
test('quitar todas las partidas deja el resultado vacío, con aviso, y desactiva el Excel y el envío con su motivo', () => {
    const ini = hecho(0, [], 'ofi', {}, 1);
    const todo = [...new Set(ini.o.r.Z.map(z => z.n))].map(C.kCap);
    const h = hecho(0, todo, 'ofi', {}, 1);
    assert.equal(h.o.r.Z.length, 0);
    assert.deepEqual(h.o.r.A, []);
    assert.equal(C.estadoEnvio(h.o.r).desactivado, true);
    assert.match(C.estadoEnvio(h.o.r).motivo, /no hay nada que descargar ni enviar/);
    assert.equal(C.estadoEnvio(ini.o.r).desactivado, false);
    assert.equal(C.estadoEnvio(ini.o.r).motivo, '');
    const html = C.listaHtml(h.o.r, h.o.full, todo, false);
    assert.match(html, /<div class="cz-empty" role="status"><b>Has quitado todas las partidas\./);
    assert.ok(!/cz-notes|cz-zone/.test(html));
    assert.equal(html.split('data-rec="').length - 1, todo.length + 1); // uno por capítulo y «Recuperar todo»
    // todas las partidas sueltas, de una en una, también vacían
    const sueltas = ini.o.r.Z.map(C.kPart);
    assert.equal(hecho(0, sueltas, 'ofi', {}, 1).o.r.Z.length, 0);
});

// ── 7. Cambiar la configuración descarta lo quitado ──
test('cambiar tipo, nivel o cifras descarta lo quitado; con la misma configuración se conserva', () => {
    const v = C.defaults('btr'), qs = C.qNuevo();
    C.qQuitar(qs, C.kCap('Gestión'), C.firma('btr', v, 1));
    assert.equal(C.qSync(qs, C.firma('btr', C.defaults('btr'), 1)), false, 'misma configuración: se conserva');
    assert.deepEqual(qs.k, [C.kCap('Gestión')]);
    assert.equal(C.qSync(qs, C.firma('btr', v, 2)), true, 'otro nivel');
    assert.deepEqual(qs.k, []);
    C.qQuitar(qs, C.kCap('Gestión'), C.firma('btr', v, 1));
    assert.equal(C.qSync(qs, C.firma('btr', Object.assign({}, v, { viv: 61 }), 1)), true, 'otra cifra');
    C.qQuitar(qs, C.kCap('Gestión'), C.firma('btr', v, 1));
    assert.equal(C.qSync(qs, C.firma('btr', Object.assign({}, v, { gar: false }), 1)), true, 'otro interruptor');
    C.qQuitar(qs, C.kCap('Gestión'), C.firma('btr', v, 1));
    assert.equal(C.qSync(qs, C.firma('bts', C.defaults('bts'), 1)), true, 'otro tipo');
    assert.equal(C.qSync(qs, C.firma('bts', C.defaults('bts'), 1)), false, 'sin nada quitado no hay nada que descartar');
    // el aviso sale una vez, en el pintado que descarta
    const h = hecho(0, [], 'btr', {}, 1);
    assert.match(C.listaHtml(h.o.r, h.o.full, [], true), /<p class="cz-aviso" role="status">Has cambiado la configuración, así que lo que habías quitado vuelve a estar incluido\.<\/p>/);
    assert.ok(!/cz-aviso/.test(C.listaHtml(h.o.r, h.o.full, [], false)));
});

// ── 8. El lead no se trunca con lo quitado ──
test('el lead con lo quitado cabe en el límite (peor caso: todo menos una partida)', () => {
    todas().forEach(([t, v, lv]) => {
        const full = C.compute(t, v, lv).full, zs = full.Z;
        if (zs.length < 2) return;
        const q = zs.slice(1).map(C.kPart), h = C.compute(t, v, lv, q);
        const s = C.resumenLead(t, v, lv, h.r, h.c, C.textoQuitados(full, q));
        assert.ok(s.length <= C.LEAD_MAX, t + lv + ' ' + s.length);
        assert.ok(s.endsWith('.') && s.includes('Quitado por el cliente: partida '));
    });
});

// ── 9. Interfaz con un DOM de mentira: clics reales de quitar y recuperar ──
function domFalso() {
    const els = {};
    const nuevo = (id) => ({
        id, innerHTML: '', textContent: '', hidden: false, style: {}, dataset: {}, disabled: false, value: '', handlers: {}, attrs: {}, enfocado: 0,
        classList: { _s: new Set(), add(c) { this._s.add(c); }, remove(c) { this._s.delete(c); }, contains(c) { return this._s.has(c); } },
        addEventListener(t, f) { (this.handlers[t] = this.handlers[t] || []).push(f); },
        setAttribute(k, v) { this.attrs[k] = v; }, scrollIntoView() {}, reset() {}, focus() { this.enfocado++; }, querySelectorAll() { return []; },
        elements: { name: { value: '', setAttribute() {} }, email: { value: '', setAttribute() {} }, company: { value: '' } }
    });
    const get = (id) => (els[id] = els[id] || nuevo(id));
    const envio = { disabled: false };
    get('f').querySelector = () => envio;
    const descargas = [];
    const doc = {
        readyState: 'complete', getElementById: get, querySelectorAll() { return []; },
        createElement() { const a = { click() { descargas.push({ href: a.href, download: a.download }); }, remove() {} }; return a; },
        body: { appendChild() {} }, addEventListener() {}
    };
    return { doc, get, descargas, envio };
}
function click(root, sel, dataset) {
    const t = { id: '', closest: (q) => (q === sel ? { dataset: dataset || {} } : null) };
    root.handlers.click.forEach(h => h({ target: t }));
}

test('interfaz: quitar y recuperar repintan lista, coste, aviso y botón de envío; el lead y el Excel salen sin lo quitado', async () => {
    const { doc, get, descargas, envio } = domFalso();
    const peticiones = [], blobs = [];
    const prev = { document: global.document, fetch: global.fetch, URL_c: URL.createObjectURL, URL_r: URL.revokeObjectURL };
    global.document = doc;
    URL.createObjectURL = (b) => { blobs.push(b); return 'blob:falso'; }; URL.revokeObjectURL = () => {};
    global.fetch = async (url, opts) => { peticiones.push(JSON.parse(opts.body).fields); return { ok: true, status: 200 }; };
    try {
        const ruta = path.join(ROOT, 'js', 'configurador.js');
        delete require.cache[ruta];
        require(ruta);
        const root = get('configurador'), f = get('f');
        const enviar = () => f.handlers.submit[0].call(f, { preventDefault() {} });
        f.elements.name.value = 'Ana Prueba'; f.elements.email.value = 'ana@ejemplo.invalid';
        click(root, '.cz-type', { t: 'btr' });
        click(root, '[data-cz]', { cz: '4' });
        assert.equal(get('czzones').attrs.tabindex, '-1');
        const costeIni = get('czcoste').innerHTML, zonasIni = get('czzones').innerHTML, totIni = get('cztot').innerHTML;
        assert.ok(zonasIni.includes('data-rm="c|Gestión"') && !zonasIni.includes('Has quitado'));
        assert.equal(envio.disabled, false);

        // quitar el capítulo Gestión
        click(root, '[data-rm]', { rm: 'c|Gestión' });
        assert.ok(!get('czzones').innerHTML.includes('Servidor de gestión de accesos</b>'));
        assert.match(get('czzones').innerHTML, /Has quitado:<\/span>.*Capítulo Gestión/);
        assert.notEqual(get('czcoste').innerHTML, costeIni);
        assert.notEqual(get('cztot').innerHTML, totIni);
        assert.ok(get('czzones').enfocado + 0 >= 0);
        enviar();
        await new Promise(r => setTimeout(r, 20));
        assert.equal(descargas.length, 1);
        assert.match(peticiones[0].message.stringValue, /Quitado por el cliente: capítulo Gestión\.$/);
        const bytes = Buffer.from(await blobs[0].arrayBuffer());
        assert.ok(!celdas(bytes).includes('SERVIDOR DE GESTIÓN DE ACCESOS'));
        // tras enviar, quitar otra cosa reabre el formulario con lo nuevo
        click(root, '[data-rm]', { rm: 'p|Seguridad|Relé de seguridad' });
        assert.equal(get('ok').classList.contains('on'), false);
        assert.equal(f.style.display, '');

        // recuperar uno
        click(root, '[data-rec]', { rec: 'c|Gestión' });
        assert.ok(get('czzones').innerHTML.includes('data-rm="c|Gestión"'));
        assert.match(get('czzones').innerHTML, /Partida Relé de seguridad/);
        assert.ok(!/Capítulo Gestión/.test(get('czzones').innerHTML.split('Has quitado:')[1]));
        // recuperar todo: igual que al principio
        click(root, '[data-rec]', { rec: '*' });
        assert.equal(get('czzones').innerHTML, zonasIni);
        assert.equal(get('czcoste').innerHTML, costeIni);
        assert.equal(get('cztot').innerHTML, totIni);

        // quitar todo: aviso, sin coste, y el envío desactivado
        const caps = ['Portales', 'Garaje', 'Zonas comunes', 'Viviendas', 'Conserjería', 'Seguridad', 'Gestión'];
        caps.forEach(c => click(root, '[data-rm]', { rm: 'c|' + c }));
        assert.match(get('czzones').innerHTML, /Has quitado todas las partidas/);
        assert.equal(get('czcoste').innerHTML, '');
        assert.equal(envio.disabled, true);
        assert.equal(f.classList.contains('vacio'), true);
        assert.match(get('ferr').textContent, /no hay nada que descargar ni enviar/);
        const n = peticiones.length, d = descargas.length;
        enviar();
        await new Promise(r => setTimeout(r, 20));
        assert.equal(peticiones.length, n, 'no se envía el lead');
        assert.equal(descargas.length, d, 'no se descarga el Excel');
        click(root, '[data-rec]', { rec: 'c|Gestión' });
        assert.equal(envio.disabled, false);
        assert.equal(get('ferr').textContent, '');
        assert.equal(f.classList.contains('vacio'), false);

        // cambiar de nivel desde el resumen descarta lo quitado y lo avisa
        click(root, '[data-lv]', { lv: '2' });
        assert.ok(get('czzones').innerHTML.includes('Has cambiado la configuración'));
        assert.ok(!get('czzones').innerHTML.includes('Has quitado:'));
        assert.ok(get('czzones').innerHTML.includes('data-rm="c|Portales"'));
        // el aviso no se repite en el siguiente pintado
        click(root, '[data-rm]', { rm: 'c|Gestión' });
        assert.ok(!get('czzones').innerHTML.includes('Has cambiado la configuración'));

        // volver a los datos y cambiar una cifra descarta; volver sin cambiar conserva
        click(root, '[data-cz]', { cz: '2' });
        click(root, '[data-cz]', { cz: '4' });
        assert.ok(get('czzones').innerHTML.includes('Has quitado:'), 'sin cambiar nada se conserva');
        click(root, '[data-cz]', { cz: '2' });
        get('cznums').handlers; // las cifras viven en cz.v: se cambia como lo hace el campo
        const inp = { dataset: { k: 'viv' }, type: 'number', value: '75', min: '1', max: '999' };
        root.handlers.input.forEach(h => h({ target: inp }));
        click(root, '[data-cz]', { cz: '4' });
        assert.ok(get('czzones').innerHTML.includes('Has cambiado la configuración'));
        assert.ok(!get('czzones').innerHTML.includes('Has quitado:'));
        // elegir otro tipo también descarta
        click(root, '[data-rm]', { rm: 'c|Gestión' });
        click(root, '.cz-type', { t: 'btr' });
        click(root, '[data-cz]', { cz: '4' });
        assert.ok(!get('czzones').innerHTML.includes('Has quitado:'));
        // empezar de nuevo
        click(root, '[data-rm]', { rm: 'c|Gestión' });
        click(root, '#cznew');
        click(root, '.cz-type', { t: 'btr' });
        click(root, '[data-cz]', { cz: '4' });
        assert.ok(!get('czzones').innerHTML.includes('Has quitado:'));
    } finally {
        global.document = prev.document; global.fetch = prev.fetch;
        URL.createObjectURL = prev.URL_c; URL.revokeObjectURL = prev.URL_r;
        if (prev.document === undefined) delete global.document;
    }
});

// ── 10. CSS ──
test('el CSS da 44 px de zona táctil a los botones de quitar y recuperar', () => {
    const css = fs.readFileSync(path.join(ROOT, 'css', 'configurador.css'), 'utf8');
    assert.match(css, /\.cz-rm \{[^}]*width: 44px; height: 44px;/);
    assert.match(css, /\.cz-rec \{ min-height: 44px;/);
    assert.match(css, /\.cz-pt-rm \{ grid-template-columns: 64px 1fr 44px; \}/);
});
