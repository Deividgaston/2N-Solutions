'use strict';
// Pruebas del encargo 0132 (node:test, sin dependencias): node --test js/tests/0132.test.cjs
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');
const { spawnSync } = require('node:child_process');

const ROOT = path.resolve(__dirname, '..', '..');
const C = require(path.join(ROOT, 'js', 'configurador.js'));
const BASE = 'ff2c6fa956866f6557d626c1240d22eab4c30683';

function refsDe(r) {
    const m = {};
    r.Z.forEach(z => z.L.forEach(([ref, q]) => { m[ref] = (m[ref] || 0) + q; }));
    return m;
}
function todas() {
    const out = [];
    C.ORDER.forEach(t => {
        [0, 1, 2].forEach(lv => {
            const base = C.defaults(t);
            out.push([t, base, lv]);
            // variantes de interruptores: todo apagado y todo encendido
            const off = {}, on = {};
            Object.keys(base).forEach(k => { off[k] = typeof base[k] === 'boolean' ? false : base[k]; on[k] = typeof base[k] === 'boolean' ? true : base[k]; });
            out.push([t, off, lv], [t, on, lv]);
        });
    });
    return out;
}

test('BTS estándar de 40 viviendas: totales del boceto, redondeados a 10 €', () => {
    const o = C.compute('bts', C.defaults('bts'), 1);
    // sin redondear: equipos + red + licencia (cifras de la tarifa PVP del 10/09/2026)
    assert.equal(o.c.A.eq + o.c.A.red + o.c.A.lic, 31816 + 920);
    assert.equal(o.c.B.eq + o.c.B.red + o.c.B.lic, 11056 + 120 + 9000);
    assert.equal(o.c.A.ports, 46);
    assert.equal(o.c.B.ports, 6);
    assert.equal(o.c.B.lic, 40 * 225); // My2N 10 años por vivienda
    assert.equal(C.eur(o.c.totA), 32740);
    assert.equal(C.eur(o.c.totB), 20180);
    assert.equal(C.fmt(o.c.totA), '32.740 €');
    assert.equal(C.fmt(o.c.totB), '20.180 €');
    assert.deepEqual(o.c.falta, []);
});

test('redondeo a 10 €', () => {
    assert.equal(C.eur(1234), 1230);
    assert.equal(C.eur(1235), 1240);
    assert.equal(C.eur(4), 0);
    assert.equal(C.eur(5), 10);
});

test('red estimada a 20 € por puerto PoE y sin cableado ni mano de obra', () => {
    assert.equal(C.RED, 20);
    const o = C.compute('ofi', C.defaults('ofi'), 1);
    assert.equal(o.c.A.red, o.c.A.ports * 20);
    assert.equal(o.c.B, null); // solo residencial lleva la columna «solo app»
    // nada de 2 hilos ni de cableado: ni en descripciones ni en fichas ni en los textos de partida
    const textos = Object.values(C.D).concat(Object.values(C.SPEC));
    todas().forEach(([t, v, lv]) => C.compute(t, v, lv).r.Z.forEach(z => textos.push(z.desc)));
    textos.forEach(x => assert.ok(!/2 hilos|dos hilos|cableado de|mano de obra/i.test(x), x.slice(0, 60)));
});

test('hotel desatendido: Access Unit QR 916201 + módulo 91550947 en marco 9155012 y caja 9155015', () => {
    const v = Object.assign(C.defaults('hot'), { des: true });
    [0, 1, 2].forEach(lv => {
        const r = C.compute('hot', v, lv).r;
        const hab = r.Z.find(z => z.n === 'Habitaciones');
        const refs = hab.L.map(x => x[0]);
        assert.deepEqual(refs, ['916201', '91550947', '9155012', '9155015']);
        assert.ok(hab.L.every(x => x[1] === v.hab));
        const zona = r.Z.find(z => z.n === 'Zonas de huéspedes');
        assert.deepEqual(zona.L.map(x => x[0]), ['916201', '91550947', '9155012', '9155015']);
    });
});

test('con Access Commander siempre van 91379601, 9137424E y 11202601', () => {
    let con = 0;
    todas().forEach(([t, v, lv]) => {
        const m = refsDe(C.compute(t, v, lv).r);
        if (m['1120120E']) {
            con++;
            ['91379601', '9137424E', '11202601'].forEach(ref => assert.ok(m[ref] > 0, t + ' nivel ' + lv + ' sin ' + ref));
        }
    });
    assert.ok(con > 20, 'se esperaba comprobar muchas combinaciones con Access Commander');
    // BTS siempre con My2N: nunca Access Commander
    [0, 1, 2].forEach(lv => assert.equal(refsDe(C.compute('bts', C.defaults('bts'), lv).r)['1120120E'], undefined));
});

test('las mediciones llevan el desglose y la descripción de partida con la redacción pedida', () => {
    todas().forEach(([t, v, lv]) => {
        C.compute(t, v, lv).r.Z.forEach(z => {
            assert.match(z.desc, /^Ud\. .+, marca 2N®\. Suministro de conjunto compuesto por: /);
            assert.match(z.desc, /Función: /);
            assert.ok(!/\b2N(?![®\w])/.test(z.desc), 'nomenclatura 2N® en ' + z.part);
            assert.ok(z.L.length > 0 && z.u > 0);
        });
    });
});

test('todas las referencias que salen tienen descripción y precio de tarifa', () => {
    const vistas = new Set();
    todas().forEach(([t, v, lv]) => {
        const o = C.compute(t, v, lv);
        Object.keys(refsDe(o.r)).forEach(ref => vistas.add(ref));
        assert.deepEqual(o.c.falta, [], t + ' ' + lv);
    });
    vistas.forEach(ref => { assert.ok(C.D[ref], 'sin descripción ' + ref); assert.ok(C.PR[ref] > 0, 'sin precio ' + ref); });
    assert.equal(Object.keys(C.PR).length, 51);
});

test('residencial: segunda columna «solo app» sin monitores y con My2N 10 años', () => {
    ['bts', 'btr'].forEach(t => {
        const o = C.compute(t, C.defaults(t), 1);
        assert.ok(o.c.B);
        assert.ok(o.c.totB < o.c.totA);
        assert.equal(o.c.B.lic, o.c.A.viv * C.MY2N10);
    });
});

// ── Excel ──
function leerZip(buf) {
    const dv = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
    let e = buf.length - 22;
    while (e >= 0 && dv.getUint32(e, true) !== 0x06054b50) e--;
    assert.ok(e >= 0, 'sin fin de directorio central');
    const n = dv.getUint16(e + 10, true), cenSize = dv.getUint32(e + 12, true), cenOff = dv.getUint32(e + 16, true);
    assert.equal(cenOff + cenSize, e, 'el directorio central debe acabar donde empieza el EOCD');
    const files = {};
    let p = cenOff;
    for (let i = 0; i < n; i++) {
        assert.equal(dv.getUint32(p, true), 0x02014b50, 'firma de directorio central');
        const crc = dv.getUint32(p + 16, true), csize = dv.getUint32(p + 20, true), usize = dv.getUint32(p + 24, true);
        const nl = dv.getUint16(p + 28, true), xl = dv.getUint16(p + 30, true), cl = dv.getUint16(p + 32, true), lho = dv.getUint32(p + 42, true);
        const name = buf.subarray(p + 46, p + 46 + nl).toString('utf8');
        assert.equal(dv.getUint32(lho, true), 0x04034b50, 'firma de cabecera local de ' + name);
        const lnl = dv.getUint16(lho + 26, true), lxl = dv.getUint16(lho + 28, true);
        assert.equal(dv.getUint16(lho + 8, true), 0, name + ' debe ir sin compresión');
        const data = buf.subarray(lho + 30 + lnl + lxl, lho + 30 + lnl + lxl + csize);
        assert.equal(csize, usize);
        assert.equal(zlib.crc32 ? zlib.crc32(data) : C.crc32(data), crc, 'CRC de ' + name);
        files[name] = data.toString('utf8');
        p += 46 + nl + xl + cl;
    }
    return files;
}

test('el XLSX generado es un zip válido con las hojas Mediciones y Desglose por referencia', () => {
    const o = C.compute('btr', C.defaults('btr'), 2);
    const bytes = C.xlsxBytes(o.r, 'btr', C.defaults('btr'), 2, '15/11/2026');
    assert.equal(bytes[0], 0x50); assert.equal(bytes[1], 0x4b);
    const f = leerZip(Buffer.from(bytes));
    ['[Content_Types].xml', '_rels/.rels', 'xl/workbook.xml', 'xl/_rels/workbook.xml.rels', 'xl/styles.xml', 'xl/worksheets/sheet1.xml', 'xl/worksheets/sheet2.xml']
        .forEach(n => assert.ok(f[n], 'falta ' + n));
    assert.match(f['xl/workbook.xml'], /<sheet name="Mediciones" sheetId="1"/);
    assert.match(f['xl/workbook.xml'], /<sheet name="Desglose por referencia" sheetId="2"/);
    // XML bien formado: cada fichero abre y cierra sus etiquetas principales
    Object.keys(f).forEach(n => assert.ok(f[n].startsWith('<?xml'), n));
    assert.match(f['xl/worksheets/sheet1.xml'], /<\/sheetData><\/worksheet>$/);
    // La hoja 1 lleva partidas con su descripción larga y la hoja 2 las cantidades totales por referencia
    assert.ok(f['xl/worksheets/sheet1.xml'].includes('Suministro de conjunto compuesto por'));
    const tot = refsDe(o.r);
    Object.keys(tot).filter(k => k.indexOf('FORTIS') !== 0).forEach(k => assert.ok(f['xl/worksheets/sheet2.xml'].includes('>' + k + '<'), 'desglose sin ' + k));
    assert.ok(!/precio|PVP|€/.test(f['xl/worksheets/sheet1.xml'].replace(/Orientativo y sin precios/, '')), 'el Excel no lleva precios');
});

test('el XLSX pasa unzip -t cuando unzip está disponible', (t) => {
    const o = C.compute('hot', C.defaults('hot'), 1);
    const bytes = C.xlsxBytes(o.r, 'hot', C.defaults('hot'), 1, '15/11/2026');
    const tmp = fs.mkdtempSync(path.join(require('node:os').tmpdir(), 'x0132-'));
    const f = path.join(tmp, 'm.xlsx');
    fs.writeFileSync(f, bytes);
    const r = spawnSync('unzip', ['-t', f], { encoding: 'utf8' });
    fs.rmSync(tmp, { recursive: true, force: true });
    if (r.error) return t.skip('unzip no está instalado: queda la prueba de estructura manual');
    assert.equal(r.status, 0, r.stdout + r.stderr);
    assert.match(r.stdout, /No errors detected/);
});

// ── Lead ──
test('el lead lleva solo los campos permitidos por las reglas de web_leads y dentro de sus límites', () => {
    const PERMITIDOS = ['name', 'email', 'company', 'projectType', 'message', 'source', 'createdAt'];
    todas().forEach(([t, v, lv]) => {
        const o = C.compute(t, v, lv);
        const f = C.leadFields({ name: 'Ana Prueba', email: 'ana@ejemplo.invalid', company: 'Estudio X' }, t, v, lv, o.r, o.c);
        Object.keys(f).forEach(k => assert.ok(PERMITIDOS.includes(k), 'campo no permitido ' + k));
        assert.equal(f.source.stringValue, 'configurador');
        assert.ok(f.projectType.stringValue.length <= 50);
        assert.ok(['bts', 'btr', 'office', 'hotel', 'retail', 'security'].includes(f.projectType.stringValue));
        assert.ok(f.message.stringValue.length > 0 && f.message.stringValue.length <= 2000);
        assert.match(f.message.stringValue, /nivel/);
        assert.ok(!isNaN(Date.parse(f.createdAt.timestampValue)));
        Object.keys(f).filter(k => k !== 'createdAt').forEach(k => assert.equal(typeof f[k].stringValue, 'string'));
    });
    const o = C.compute('bts', C.defaults('bts'), 1);
    const sin = C.leadFields({ name: 'A', email: 'a@b.invalid', company: '' }, 'bts', C.defaults('bts'), 1, o.r, o.c);
    assert.ok(!('company' in sin), 'sin empresa no se envía el campo');
    assert.match(sin.message.stringValue, /32\.740 € con monitor, 20\.180 € solo app/);
});

// ── Productos: ficheros enlazados ──
test('las fotos y fichas que enlaza productos existen en media/productos y fichas', () => {
    const src = fs.readFileSync(path.join(ROOT, 'js', 'productos-renderer.js'), 'utf8');
    const imgs = [...src.matchAll(/img: '(pn_[a-z0-9]+)'/g)].map(m => m[1]);
    assert.equal(new Set(imgs).size, 17); // IP Solo no tiene foto normalizada: sigue con su imageUrl
    imgs.forEach(i => assert.ok(fs.existsSync(path.join(ROOT, 'media', 'productos', i + '.jpg')), i));
    const fichas = [...src.matchAll(/FICHA_LOCAL\('([^']+)'\)/g)].map(m => m[1]);
    assert.equal(new Set(fichas).size, 10);
    fichas.forEach(f => assert.ok(fs.existsSync(path.join(ROOT, 'fichas', '2N_Ficha-tecnica_' + f + '_ES.pdf')), f));
    assert.equal(fs.readdirSync(path.join(ROOT, 'fichas')).filter(f => f.endsWith('.pdf')).length, 10);
    // Indoor Talk y Access Unit QR no tienen ficha en castellano: sin enlace
    src.split('\n').filter(l => /re: \/(indoor talk|access unit qr)\//.test(l)).forEach(l => assert.ok(!/ficha/.test(l), l));
    assert.equal(src.split('\n').filter(l => /re: \/(indoor talk|access unit qr)\//.test(l)).length, 2);
});

// ── Alcance ──
test('el diff no cambia ninguna ruta assets/<subcarpeta>/ respecto a ff2c6fa', () => {
    const git = (...a) => spawnSync('git', a, { cwd: ROOT, encoding: 'utf8' });
    const ok = git('cat-file', '-e', BASE + '^{commit}');
    assert.equal(ok.status, 0, 'no está el commit base ' + BASE + ': ' + ok.stderr);
    const tracked = git('diff', '--name-only', BASE).stdout.split('\n').filter(Boolean);
    const nuevos = git('ls-files', '--others', '--exclude-standard').stdout.split('\n').filter(Boolean);
    const tocados = tracked.concat(nuevos).filter(f => /^assets\/[^/]+\//.test(f));
    assert.deepEqual(tocados, []);
    // y nada de lo prohibido
    const PROHIBIDO = [/^firebase\.json$/, /^firestore\.rules$/, /^storage\.rules$/, /^js\/firebase-init\.js$/, /^js\/services\//, /^scripts\//, /^casos-exito\.html$/];
    const prohibidos = tracked.concat(nuevos).filter(f => PROHIBIDO.some(re => re.test(f)));
    assert.deepEqual(prohibidos, []);
});
