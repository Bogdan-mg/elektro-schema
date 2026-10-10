import { test } from 'node:test';
import assert from 'node:assert/strict';
import { symbool, icoon } from '../app/js/symbolen.js';
import { nieuwItem } from '../app/js/model.js';
import { PALET, LICHTPUNTEN, SCHAKELAARS, TOESTELLEN, diffTekst, kabelTekst } from '../app/js/catalogus.js';

test('opschriften zoals in het AREI', () => {
  assert.equal(diffTekst({ stroom: 40, gevoeligheid: 300 }), '40/0,3A');
  assert.equal(diffTekst({ stroom: 40, gevoeligheid: 30 }), '40/0,03A');
  assert.equal(kabelTekst({ type: 'XVB', aders: 3, sectie: 2.5 }), 'XVB Cca 3G2,5');
  assert.equal(kabelTekst({ type: 'VOB', aders: 3, sectie: 1.5 }), 'VOB 3×1,5');
});

test('elk onderdeel heeft een geldig symbool', () => {
  const items = [
    ...[1, 2, 3, 4].flatMap((aantal) => [true, false].map((aarding) => nieuwItem('stopcontact', { aantal, aarding, waterdicht: !aarding }))),
    ...Object.keys(LICHTPUNTEN).map((variant) => nieuwItem('lichtpunt', { variant })),
    ...Object.keys(SCHAKELAARS).map((variant) => nieuwItem('schakelaar', { variant, aantal: 2 })),
    ...Object.keys(TOESTELLEN).flatMap((variant) => ['vast', 'stopcontact'].map((aansluiting) => nieuwItem('toestel', { variant, aansluiting }))),
    nieuwItem('aftakdoos'),
    ...PALET.map((p) => nieuwItem(p.soort, p.waarden)),
  ];
  for (const item of items) {
    const s = symbool(item);
    assert.ok(s.svg.length > 20, `${item.soort}/${item.variant}`);
    assert.ok(s.b > 10 && s.b < 60, `breedte ${item.soort}/${item.variant}: ${s.b}`);
    assert.doesNotMatch(s.svg, /NaN|undefined/, `${item.soort}/${item.variant}`);
    assert.match(icoon(item), /^<svg class="icoon"/);
  }
});
