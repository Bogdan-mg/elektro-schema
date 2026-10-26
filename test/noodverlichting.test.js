import { test } from 'node:test';
import assert from 'node:assert/strict';
import { nieuwProject, nieuweKring, nieuwItem, nieuwId } from '../app/js/model.js';
import { noodLijst, noodTabel } from '../app/js/noodverlichting.js';
import { kabelTekst, brandklasse } from '../app/js/catalogus.js';
import { tekenProjectEendraad } from '../app/js/trikker/eendraad/project.js';

test('noodverlichting wordt gelijst met kring, soort en plaats op het plan', () => {
  const p = nieuwProject();
  const plan = p.plannen[0];
  plan.schaal = 100;
  plan.teksten.push({ id: nieuwId(), tekst: 'Hal', x: 200, y: 300 });
  const nood = nieuwItem('lichtpunt', { nood: 'centraal', tekst: '' });
  const nood2 = nieuwItem('lichtpunt', { nood: 'decentraal', tekst: 'trap', aantal: 2 });
  const gewoon = nieuwItem('lichtpunt');
  p.kinderen.push(nieuweKring({ naam: 'Verlichting', items: [gewoon, nood, nood2] }));
  plan.plaatsingen[nood.id] = { x: 250, y: 330, rot: 0 };
  const l = noodLijst(p);
  assert.equal(l.rijen.length, 2);
  assert.equal(l.totaal, 3);
  assert.equal(l.centraal, 1);
  assert.equal(l.decentraal, 2);
  assert.equal(l.zonderPlaats, 1);
  const eerste = l.rijen.find((r) => r.id === nood.id);
  assert.equal(eerste.type, 'Centraal');
  assert.equal(eerste.ruimte, 'Hal'); // de dichtstbijzijnde tekst op het plan
  assert.equal(eerste.plan, 'Gelijkvloers');
  assert.equal(eerste.x, 2.5);
  assert.equal(eerste.y, 3.3);
  assert.equal(eerste.code, 'A2');
  const tweede = l.rijen.find((r) => r.id === nood2.id);
  assert.equal(tweede.ruimte, 'trap'); // de eigen tekst bij het onderdeel gaat voor
  assert.equal(tweede.opPlan, false);
  assert.match(noodTabel(p).html, /nog niet op het situatieschema/);
});

test('zonder noodverlichting is de lijst leeg', () => {
  const p = nieuwProject();
  p.kinderen.push(nieuweKring({ items: [nieuwItem('lichtpunt')] }));
  assert.equal(noodLijst(p).rijen.length, 0);
  assert.equal(noodTabel(p).html, '');
});

test('de brandklasse van kabels volgt de standaard van het project', () => {
  const xvb = { type: 'XVB', aders: 3, sectie: 2.5 };
  assert.equal(kabelTekst(xvb), 'XVB Cca 3G2,5');
  assert.equal(kabelTekst(xvb, 'Eca'), 'XVB Eca 3G2,5');
  assert.equal(kabelTekst(xvb, 'geen'), 'XVB 3G2,5');
  assert.equal(kabelTekst({ ...xvb, klasse: 'Dca' }, 'Eca'), 'XVB Dca 3G2,5'); // de kring zelf gaat voor
  assert.equal(kabelTekst({ ...xvb, klasse: 'geen' }, 'Eca'), 'XVB 3G2,5');
  assert.equal(brandklasse({ type: 'EXVB' }), 'Cca'); // ook andere kabels krijgen hem automatisch
  assert.equal(brandklasse({ type: 'VOB' }), ''); // draad in een buis niet
  assert.equal(brandklasse({ type: 'H07RN-F' }), '');
});

test('de brandklasse komt op het ééndraadschema', () => {
  const p = nieuwProject();
  p.kinderen.push(nieuweKring({ kabel: { type: 'XVB', aders: 3, sectie: 2.5, lengte: 0 } }));
  assert.match(tekenProjectEendraad(p).inhoud, />ca</); // "ca" als subscript na de C
  p.opties.brandklasse = 'geen';
  assert.doesNotMatch(tekenProjectEendraad(p).inhoud, />ca</);
});
