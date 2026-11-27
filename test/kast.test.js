import { test } from 'node:test';
import assert from 'node:assert/strict';
import { nieuweKring, nieuwItem } from '../app/js/model.js';
import { samenvatting } from '../app/js/kast.js';

test('samenvatting van een kring telt per naam', () => {
  const kr = nieuweKring({ items: [nieuwItem('stopcontact', { aantal: 2 }), nieuwItem('stopcontact'), nieuwItem('stopcontact')] });
  const tekst = samenvatting(kr);
  assert.match(tekst, /1× dubbel stopcontact/);
  assert.match(tekst, /2× stopcontact/);
  assert.doesNotMatch(tekst, /3×/);
});
