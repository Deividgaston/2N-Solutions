#!/usr/bin/env bash
# Compara rutas con Git sin procesos hijos desde Node (bloqueados en A5).
set -euo pipefail
cd "$(dirname "$0")/../.."
baseline=ff2c6fa956866f6557d626c1240d22eab4c30683
snapshot=$(mktemp -d /tmp/nexo-0128-assets.XXXXXX)
trap 'rm -rf "$snapshot"' EXIT
git diff --name-only "$baseline" -- '*.html' 'css/*.css' 'js/*.js' > "$snapshot/files"
while IFS= read -r file; do
    mkdir -p "$snapshot/$(dirname "$file")"
    if git cat-file -e "$baseline:$file" 2>/dev/null; then
        git show "$baseline:$file" > "$snapshot/$file"
    else
        : > "$snapshot/$file"
    fi
done < "$snapshot/files"
node - "$snapshot" <<'NODE'
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const snapshot = process.argv[2];
const files = fs.readFileSync(path.join(snapshot, 'files'), 'utf8').trim().split('\n').filter(Boolean);
const references = source => [...source.matchAll(/assets\/[\w.-]+\/[^\s"'`()<>;,]+/g)].map(match => match[0]);
let count = 0;
for (const file of files) {
    const original = references(fs.readFileSync(path.join(snapshot, file), 'utf8'));
    // Se mantiene retirada la tarjeta Retail, autorizada en la vuelta 1.
    const expected = original.filter(ref => file !== 'index.html' || ref !== 'assets/web/vertical-retail.webp');
    assert.deepEqual(references(fs.readFileSync(file, 'utf8')), expected, file);
    count += expected.length;
}
console.log(`PASS · ${files.length} ficheros · ${count} referencias originales conservadas · única baja: foto de tarjeta Retail retirada`);
NODE
