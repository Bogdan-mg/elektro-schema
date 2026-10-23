// De materiaallijst van Trikker (Bom.cs) nagebouwd in JavaScript, vergeleken met de opgeslagen uitvoer van de echte Bom-klasse
// (test/trikker/bom/waar.jsonl, gemaakt met de C#-proefopstelling; zie tools/trikker/LEESMIJ.md).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';
import { bom, sorteerBom, lijnenVoorKnoop } from '../app/js/trikker/bom.js';

const hier = dirname(fileURLToPath(import.meta.url));
const waar = readFileSync(join(hier, 'trikker', 'bom', 'waar.jsonl'), 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l));

/** "Klasse;Eigenschap=Waarde;..." als knoop. */
const knoopVan = (spec) => {
  const [klasse, ...rest] = spec.split(';');
  const props = {};
  let toonOpBom;
  for (const r of rest) {
    const i = r.indexOf('=');
    const naam = r.slice(0, i);
    const w = r.slice(i + 1);
    if (naam === 'ToonOpBom') toonOpBom = w === 'Ja';
    else props[naam] = w;
  }
  return { klasse, props, toonOpBom };
};

test('de fixture van Trikker bevat voldoende gevallen', () => {
  assert.ok(waar.length > 1500);
  assert.equal(waar.filter((x) => x.fout).length, 0);
});

test('elke knoop geeft dezelfde lijnen als Bom.cs van Trikker', () => {
  const fouten = [];
  let gevallen = 0;
  for (const x of waar.filter((w) => !w.spec.startsWith('DOC|'))) {
    gevallen += 1;
    const mijn = bom([knoopVan(x.spec)]).map((r) => [r.omschrijving, r.aantal]);
    if (JSON.stringify(mijn) !== JSON.stringify(x.lijnen)) fouten.push(`${x.spec}\n   Trikker: ${JSON.stringify(x.lijnen)}\n   Hier:    ${JSON.stringify(mijn)}`);
  }
  assert.ok(gevallen > 1500);
  assert.deepEqual(fouten.slice(0, 5), []);
  assert.equal(fouten.length, 0);
});

test('een document met meer knopen telt samen en sorteert zoals Trikker', () => {
  const fouten = [];
  let gevallen = 0;
  for (const x of waar.filter((w) => w.spec.startsWith('DOC|'))) {
    gevallen += 1;
    const knopen = x.spec.slice(4).split('|').map(knoopVan);
    const mijn = sorteerBom(bom(knopen)).map((r) => [r.omschrijving, r.aantal]);
    if (JSON.stringify(mijn) !== JSON.stringify(x.lijnen)) fouten.push(`${x.spec}\n   Trikker: ${JSON.stringify(x.lijnen)}\n   Hier:    ${JSON.stringify(mijn)}`);
  }
  assert.equal(gevallen, 60);
  assert.deepEqual(fouten.slice(0, 3), []);
});

test('Ketel, Nota, Toestel, ToestelKlein en Verdeelbord staan standaard niet op de materiaallijst, tenzij je het aanzet', () => {
  assert.deepEqual(lijnenVoorKnoop({ klasse: 'Ketel', props: {} }), []);
  assert.equal(lijnenVoorKnoop({ klasse: 'Ketel', props: {}, toonOpBom: true }).length, 1);
  assert.deepEqual(lijnenVoorKnoop({ klasse: 'Nota', props: { Tekst: 'abc' } }), []);
});
