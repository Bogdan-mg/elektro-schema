import { test } from 'node:test';
import assert from 'node:assert/strict';
import { planSymbool, symbool } from '../app/js/symbolen.js';
import { nieuwPlan, nieuwProject, nieuweKring, nieuwDifferentieel, nieuwItem, wijsToeEen, maakLos, kringVanItem, codes, rijen, kastNamen } from '../app/js/model.js';

function projectMet() {
  const p = nieuwProject();
  const d = nieuwDifferentieel({ naam: 'Diff' });
  const k1 = nieuweKring({ naam: 'Licht' });
  const k2 = nieuweKring({ naam: 'Stopcontacten' });
  d.kinderen.push(k1, k2);
  p.kinderen.push(d);
  const plan = p.plannen[0];
  const los = (soort, x, w = {}) => {
    const item = nieuwItem(soort, w);
    plan.plaatsingen[item.id] = { x, y: 0, rot: 0, los: true, item };
    return item;
  };
  return { p, k1, k2, plan, los };
}

test('een symbool aan een kring hangen en weer los maken', () => {
  const { p, k1, plan, los } = projectMet();
  const sc = los('stopcontact', 10);
  assert.equal(wijsToeEen(p, sc.id, k1.id), 1);
  assert.equal(k1.items.length, 1);
  assert.equal(plan.plaatsingen[sc.id].los, undefined);
  assert.equal(kringVanItem(p, sc.id).id, k1.id);
  assert.equal(maakLos(p, sc.id), true);
  assert.equal(k1.items.length, 0);
  assert.equal(plan.plaatsingen[sc.id].los, true);
  assert.equal(plan.plaatsingen[sc.id].item.id, sc.id);
});

test('een schakelaar neemt zijn lampen mee en vormt één rij', () => {
  const { p, k1, plan, los } = projectMet();
  const s = los('schakelaar', 0);
  const l1 = los('lichtpunt', 50);
  const l2 = los('lichtpunt', 100);
  plan.verbindingen = [{ id: 'v1', van: s.id, naar: l1.id }, { id: 'v2', van: s.id, naar: l2.id }];
  assert.equal(wijsToeEen(p, s.id, k1.id), 3);
  assert.deepEqual(k1.items.map((i) => i.id), [s.id, l1.id, l2.id]);
  assert.equal(rijen(k1).length, 1);
  const code = codes(p);
  assert.equal(code.get(s.id), code.get(l1.id));
});

test('een lamp komt achter zijn schakelaar te staan', () => {
  const { p, k1, plan, los } = projectMet();
  const s = los('schakelaar', 0);
  const andere = los('stopcontact', 5);
  const l = los('lichtpunt', 50);
  plan.verbindingen = [{ id: 'v1', van: s.id, naar: l.id }];
  wijsToeEen(p, s.id, k1.id);
  wijsToeEen(p, andere.id, k1.id);
  wijsToeEen(p, l.id, k1.id);
  assert.deepEqual(k1.items.map((i) => i.id), [s.id, l.id, andere.id]);
});

test('van de ene kring naar de andere verplaatsen', () => {
  const { p, k1, k2, los } = projectMet();
  const sc = los('stopcontact', 10);
  wijsToeEen(p, sc.id, k1.id);
  assert.equal(wijsToeEen(p, sc.id, k2.id), 1);
  assert.equal(k1.items.length, 0);
  assert.equal(k2.items.length, 1);
});

test('kasten', () => {
  assert.deepEqual(kastNamen(nieuwProject()), ['Verdeelbord']);
  assert.deepEqual(kastNamen({ kasten: ['A', 'B'] }), ['A', 'B']);
});

test('symbolen op het plan hebben geen aanvoerleiding, een contactdoos wel een kort steeltje', () => {
  const lamp = planSymbool(nieuwItem('lichtpunt'));
  assert.ok(!/^<line class="l" x1="0" y1="0" x2="[\d.]+" y2="0"\/>/.test(lamp.svg));
  assert.ok(lamp.b < symbool(nieuwItem('lichtpunt')).b);
  const sc = planSymbool(nieuwItem('stopcontact'));
  // zoals in Trikker: een steeltje van 3 eenheden (35 mm) tot aan de muur, links van het midden
  assert.match(sc.svg, /<line x1="-3" y1="0" x2="0" y2="0"/);
  assert.ok(sc.svg.includes('class="tk"'));
});

test('tekst en adres bij een symbool volgen Trikker', async () => {
  const { plaatsingSvg, volgendeTekstPlaats, volgendeAdresPlaats } = await import('../app/js/plan.js');
  const plan = nieuwPlan();
  plan.symbool = 1;
  const deel = { item: { ...nieuwItem('stopcontact'), id: 'a' }, code: 'B2' };
  const tekstVan = (pl) => /<text class="b plan-code"[^>]*x="([-\d.]+)" y="([-\d.]+)"[^>]*text-anchor="(\w+)"/.exec(plaatsingSvg(deel, pl, 1, false, 'a', { plan, anderen: [] }));
  // Automatisch: onder het symbool, gecentreerd, de boven-rand van de tekst op de afstand die het symbool opgeeft.
  const auto = tekstVan({ x: 100, y: 100, rot: 0 });
  assert.equal(auto[3], 'middle');
  assert.ok(Number(auto[2]) > 0);
  // Rechts, links, boven kiezen het anker en de kant.
  assert.equal(tekstVan({ x: 100, y: 100, rot: 0, tekstPlaats: 'rechts' })[3], 'start');
  assert.equal(tekstVan({ x: 100, y: 100, rot: 0, tekstPlaats: 'links' })[3], 'end');
  assert.ok(Number(tekstVan({ x: 100, y: 100, rot: 0, tekstPlaats: 'boven' })[2]) < 0);
  // Verbergen: geen tekst.
  assert.equal(tekstVan({ x: 100, y: 100, rot: 0, tekstPlaats: 'verbergen' }), null);
  // Een muur onder het symbool: dan gaat de tekst naar rechts (de volgende plaats in Trikkers volgorde).
  plan.muren.push({ soort: 'muur', x1: 0, y1: 118, x2: 300, y2: 118 });
  assert.equal(tekstVan({ x: 100, y: 100, rot: 0 })[3], 'start');
  // Shift + rechtsklik en Ctrl + rechtsklik doorlopen dezelfde volgorde als Trikker.
  assert.equal(volgendeTekstPlaats('auto'), 'links');
  assert.equal(volgendeTekstPlaats('onder'), 'verbergen');
  assert.equal(volgendeTekstPlaats('verbergen'), 'auto');
  assert.equal(volgendeAdresPlaats(undefined), 'plus90');
  assert.equal(volgendeAdresPlaats('plus270'), 'verbergen');
  assert.equal(volgendeAdresPlaats('verbergen'), 'plus0');
  // Een adres bij een domoticasymbool wordt cursief in het draaiende vlak van het symbool getekend.
  const relais = { item: { ...nieuwItem('relais'), id: 'r', adres: 'A1.2' }, code: 'B3' };
  const svg = plaatsingSvg(relais, { x: 0, y: 0, rot: 0 }, 1, false, 'r', { plan: nieuwPlan(), anderen: [] });
  assert.match(svg, /class="tk-adres"/);
  assert.match(svg, /font-style="italic"[^>]*>A1\.2</);
  // Zonder adres geen adrestekst; bij "verbergen" ook niet.
  assert.ok(!plaatsingSvg({ ...relais, item: { ...relais.item, adres: '' } }, { x: 0, y: 0, rot: 0 }, 1, false, 'r', { plan: nieuwPlan(), anderen: [] }).includes('tk-adres'));
  assert.ok(!plaatsingSvg(relais, { x: 0, y: 0, rot: 0, adresPlaats: 'verbergen' }, 1, false, 'r', { plan: nieuwPlan(), anderen: [] }).includes('tk-adres'));
});
