import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  nieuwProject, nieuwDifferentieel, nieuweKring, nieuwItem, voegKnoopToe, voegItemToe, verwijder, verschuif,
  dupliceer, verplaatsNaar, codes, letter, leesProject, teBewaren, voorbeeldProject, zoek,
} from '../app/js/model.js';

test('letters voor kringen', () => {
  assert.equal(letter(0), 'A');
  assert.equal(letter(25), 'Z');
  assert.equal(letter(26), 'AA');
  assert.equal(letter(27), 'AB');
});

test('codes volgen de tekenvolgorde', () => {
  const p = nieuwProject();
  const d = voegKnoopToe(p, null, nieuwDifferentieel());
  const k1 = voegKnoopToe(p, d.id, nieuweKring());
  const k2 = voegKnoopToe(p, null, nieuweKring());
  const i1 = voegItemToe(p, k1.id, nieuwItem('stopcontact'));
  const i2 = voegItemToe(p, k1.id, nieuwItem('lichtpunt'));
  const i3 = voegItemToe(p, k2.id, nieuwItem('schakelaar'));
  const c = codes(p);
  assert.equal(c.get(k1.id), 'A');
  assert.equal(c.get(k2.id), 'B');
  assert.equal(c.get(i1.id), 'A1');
  assert.equal(c.get(i2.id), 'A2');
  assert.equal(c.get(i3.id), 'B1');
});

test('toevoegen na een gekozen kring of onderdeel', () => {
  const p = nieuwProject();
  const k1 = voegKnoopToe(p, null, nieuweKring());
  const k2 = voegKnoopToe(p, null, nieuweKring());
  const k3 = voegKnoopToe(p, k1.id, nieuweKring());
  assert.deepEqual(p.kinderen.map((k) => k.id), [k1.id, k3.id, k2.id]);
  const a = voegItemToe(p, k1.id, nieuwItem('stopcontact'));
  const b = voegItemToe(p, k1.id, nieuwItem('stopcontact'));
  const c = voegItemToe(p, a.id, nieuwItem('lichtpunt'));
  assert.deepEqual(k1.items.map((i) => i.id), [a.id, c.id, b.id]);
  assert.equal(voegItemToe(p, null, nieuwItem('stopcontact')), null);
});

test('verwijderen haalt ook de plaatsingen weg', () => {
  const p = nieuwProject();
  const d = voegKnoopToe(p, null, nieuwDifferentieel());
  const k = voegKnoopToe(p, d.id, nieuweKring());
  const i = voegItemToe(p, k.id, nieuwItem('stopcontact'));
  p.plannen[0].plaatsingen[i.id] = { x: 1, y: 2, rot: 0 };
  const volgende = verwijder(p, d.id);
  assert.equal(volgende, 'hoofd');
  assert.equal(p.kinderen.length, 0);
  assert.deepEqual(p.plannen[0].plaatsingen, {});
});

test('verschuiven, dupliceren en verplaatsen', () => {
  const p = nieuwProject();
  const d = voegKnoopToe(p, null, nieuwDifferentieel());
  const k1 = voegKnoopToe(p, null, nieuweKring({ naam: 'een' }));
  const k2 = voegKnoopToe(p, null, nieuweKring({ naam: 'twee' }));
  assert.ok(verschuif(p, k2.id, -1));
  assert.deepEqual(p.kinderen.map((k) => k.naam ?? 'diff'), ['diff', 'twee', 'een']);
  assert.ok(!verschuif(p, d.id, -1));
  const kopie = dupliceer(p, k1.id);
  assert.notEqual(kopie.id, k1.id);
  assert.equal(kopie.naam, 'een');
  assert.ok(verplaatsNaar(p, k1.id, d.id));
  assert.equal(d.kinderen[0], k1);
  assert.ok(!verplaatsNaar(p, d.id, d.id));
  const i = voegItemToe(p, k1.id, nieuwItem('stopcontact'));
  assert.ok(verplaatsNaar(p, i.id, k2.id));
  assert.equal(zoek(p, i.id).ouder, k2);
  assert.ok(!verplaatsNaar(p, i.id, d.id));
});

test('een differentieel kan niet in zijn eigen kind', () => {
  const p = nieuwProject();
  const d1 = voegKnoopToe(p, null, nieuwDifferentieel());
  const d2 = voegKnoopToe(p, d1.id, nieuwDifferentieel());
  assert.ok(!verplaatsNaar(p, d1.id, d2.id));
});

test('opslaan en terug openen geeft hetzelfde project', () => {
  const p = voorbeeldProject();
  p.afbeeldingen.ongebruikt = { src: 'data:', breedte: 1, hoogte: 1 };
  const terug = leesProject(teBewaren(p));
  assert.deepEqual(terug.afbeeldingen, {});
  delete p.afbeeldingen.ongebruikt;
  assert.deepEqual(terug, p);
});

test('ongeldige bestanden geven een duidelijke fout', () => {
  assert.throws(() => leesProject('niet json'), /geen geldig/);
  assert.throws(() => leesProject('{"a":1}'), /geen geldig/);
  assert.throws(() => leesProject(JSON.stringify({ ...nieuwProject(), versie: 99 })), /nieuwere versie/);
});

test('oudere bestanden worden aangevuld', () => {
  const p = leesProject(JSON.stringify({ kinderen: [{ id: 'k', soort: 'kring', items: [{ id: 'i', soort: 'stopcontact' }] }] }));
  assert.equal(p.kinderen[0].automaat.stroom, 20);
  assert.equal(p.kinderen[0].items[0].aarding, true);
  assert.equal(p.plannen.length, 1);
});
