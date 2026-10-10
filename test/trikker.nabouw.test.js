// Controleert de JavaScript-nabouw van de Trikker-symbolen tegenover de opgeslagen echte uitvoer van Trikker (geen .NET nodig).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';
import { vergelijkResultaat } from './trikker/vergelijk-lib.mjs';

const hier = dirname(fileURLToPath(import.meta.url));
const map = join(hier, 'trikker', 'fixtures');
for (const f of readdirSync(map).filter((x) => x.endsWith('.json'))) {
  const klasse = f.replace('.json', '');
  test(`Trikker-symbool ${klasse} is gelijk aan de echte uitvoer`, async () => {
    const mod = await import(`../app/js/trikker/${klasse}.js`);
    const items = JSON.parse(readFileSync(join(map, f), 'utf8'));
    const fouten = [];
    for (const { props, waar } of items) {
      const m = vergelijkResultaat(mod, props, waar);
      if (m.length) fouten.push(`${waar.spec}: ${m[0]}`);
    }
    assert.deepEqual(fouten, []);
  });
}
