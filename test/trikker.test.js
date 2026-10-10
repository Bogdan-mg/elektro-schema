import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  nieuwProject, nieuwDifferentieel, nieuweKring, nieuwItem, nieuwPlan, nieuwElement, codes, kopieerNode, plakNode, koppelLos, losseSymbolen,
  leesProject, teBewaren,
} from '../app/js/model.js';
import { omhulsel, verschuifElement, handvatten, cirkelDoor, draaiPunt, segmentSvg, codeDelen, tekenPlan, plaatsingSvg } from '../app/js/plan.js';
import { materiaallijst } from '../app/js/materiaal.js';
import { leesDxf, dxfNaarSvg } from '../app/js/dxf.js';
import { tekenEendraad } from '../app/js/eendraad.js';

test('een nummer voor het bord komt voor de letter van elke kring', () => {
  const p = nieuwProject();
  const k1 = nieuweKring();
  const k2 = nieuweKring();
  const groep = nieuwDifferentieel({ nummer: '2', kinderen: [nieuweKring(), nieuweKring()] });
  p.kinderen.push(k1, k2, groep);
  p.hoofd.nummer = '1';
  const c = codes(p);
  assert.equal(c.get(k1.id), '1A');
  assert.equal(c.get(k2.id), '1B');
  assert.equal(c.get(groep.id), '1C');
  // De kringen in een groep met een eigen nummer beginnen opnieuw bij A.
  assert.equal(c.get(groep.kinderen[0].id), '2A');
  assert.equal(c.get(groep.kinderen[1].id), '2B');
});

test('een gekopieerde kring krijgt nieuwe id’s', () => {
  const p = nieuwProject();
  const k = nieuweKring({ naam: 'keuken', items: [nieuwItem('stopcontact')] });
  p.kinderen.push(k);
  const kopie = kopieerNode(p, k.id);
  const nieuw = plakNode(p, k.id, kopie);
  assert.notEqual(nieuw.id, k.id);
  assert.notEqual(nieuw.items[0].id, k.items[0].id);
  assert.equal(p.kinderen.length, 2);
  // Een onderdeel plak je in een kring.
  const it = plakNode(p, k.id, k.items[0]);
  assert.equal(k.items.length, 2);
  assert.ok(it);
});

test('een los symbool koppelen aan een kring', () => {
  const p = nieuwProject();
  const k = nieuweKring();
  p.kinderen.push(k);
  const item = nieuwItem('stopcontact');
  p.plannen[0].plaatsingen[item.id] = { x: 10, y: 20, rot: 0, los: true, item };
  assert.equal(losseSymbolen(p).length, 1);
  assert.equal(materiaallijst(p).regels.some((r) => /Stopcontact/.test(r.omschrijving)), true);
  assert.ok(koppelLos(p, item.id, k.id));
  assert.equal(k.items.length, 1);
  assert.equal(losseSymbolen(p).length, 0);
  assert.equal(p.plannen[0].plaatsingen[item.id].x, 10);
  assert.equal(p.plannen[0].plaatsingen[item.id].los, undefined);
});

test('een eigen symbool komt enkel op de materiaallijst met een omschrijving', () => {
  const p = nieuwProject();
  p.kinderen.push(nieuweKring({ items: [nieuwItem('eigen', { omschrijving: '' }), nieuwItem('eigen', { omschrijving: 'Rookmelder' }), nieuwItem('eigen', { omschrijving: 'Rookmelder' })] }));
  const regel = materiaallijst(p).regels.filter((r) => r.groep === 'Eigen symbolen');
  assert.equal(regel.length, 1);
  assert.equal(regel[0].aantal, 2);
});

test('elementen: omhulsel, verschuiven en handvatten', () => {
  const rechthoek = nieuwElement('rechthoek', { cx: 100, cy: 100, w: 40, h: 20, hoek: 0 });
  assert.deepEqual(omhulsel(rechthoek), { x0: 80, y0: 90, x1: 120, y1: 110 });
  verschuifElement(rechthoek, 10, 5);
  assert.equal(rechthoek.cx, 110);
  assert.equal(handvatten(rechthoek).length, 2);
  const muur = nieuwElement('muur', { x1: 0, y1: 0, x2: 100, y2: 0 });
  verschuifElement(muur, 5, 5, 'p2');
  assert.equal(muur.x2, 105);
  assert.equal(muur.x1, 0);
  const boog = nieuwElement('boog', { x1: 0, y1: 0, x2: 100, y2: 0, bx: 50, by: -50 });
  assert.equal(handvatten(boog).length, 3);
  const c = cirkelDoor(boog);
  assert.ok(Math.abs(c.r - 50) < 1e-6);
  const d = draaiPunt(10, 0, 0, 0, 90);
  assert.ok(Math.abs(d.x) < 1e-9 && Math.abs(d.y - 10) < 1e-9);
});

test('alle soorten elementen tekenen zonder fouten', () => {
  const plan = nieuwPlan();
  const lijst = [
    { soort: 'muur', x1: 0, y1: 0, x2: 100, y2: 0 }, { soort: 'boog', x1: 0, y1: 0, x2: 100, y2: 0, bx: 50, by: -50 },
    { soort: 'deur', x1: 0, y1: 0, x2: 90, y2: 0, type: 'dubbel' }, { soort: 'deur', x1: 0, y1: 0, x2: 90, y2: 0, type: 'schuif' },
    { soort: 'poort', x1: 0, y1: 0, x2: 200, y2: 0 }, { soort: 'raam', x1: 0, y1: 0, x2: 100, y2: 0 },
    { soort: 'trap', x1: 0, y1: 0, x2: 0, y2: 200, breedte: 90 }, { soort: 'draaitrap', x1: 0, y1: 0, x2: 60, y2: 0 },
    { soort: 'rechthoek', cx: 0, cy: 0, w: 50, h: 30, hoek: 20 }, { soort: 'vlak', cx: 0, cy: 0, w: 50, h: 30, hoek: 0, kleur: '#ff0000', transparantie: 0.3 },
    { soort: 'lijn', x1: 0, y1: 0, x2: 10, y2: 10, dikte: 0.5, kleur: '#00f' }, { soort: 'maat', x1: 0, y1: 0, x2: 200, y2: 0, afstand: 30 },
    { soort: 'meet', x1: 0, y1: 0, x2: 100, y2: 0 }, { soort: 'afbeelding', cx: 0, cy: 0, w: 50, h: 30, hoek: 0, afb: 'x' },
  ];
  for (const m of lijst) {
    const { svg } = segmentSvg({ ...m, id: m.soort }, 0, plan, { afbeeldingen: {} });
    assert.match(svg, /</, m.soort);
    assert.ok(!svg.includes('NaN'), `${m.soort}: NaN`);
  }
  // Een maatlijn toont altijd zijn tekst, de rest enkel als je erop klikt.
  plan.muren = lijst.map((m, i) => ({ ...m, id: `e${i}` }));
  const svg = tekenPlan(nieuwProject(), plan);
  assert.match(svg, /2,00 m/);
  assert.ok(!svg.includes('NaN'));
});

test('de tekst bij een symbool volgt beletteren, nummeren en het adres', () => {
  const p = nieuwProject();
  const it = nieuwItem('stopcontact', { adres: 'K.01' });
  p.kinderen.push(nieuweKring({ items: [it] }));
  const plan = p.plannen[0];
  const deel = { item: it, code: 'A1' };
  const pl = { x: 50, y: 50, rot: 0 };
  assert.deepEqual(codeDelen('B12'), { letter: 'B', nummer: '12' });
  const met = (extra, opties = {}) => plaatsingSvg(deel, { ...pl, ...extra }, 1, false, it.id, { plan: { ...plan, ...opties }, anderen: [] });
  // Met een adres staat er enkel het adres (de kring niet) ...
  assert.match(met({}), />K\.01</);
  assert.doesNotMatch(met({}), />A1</);
  // ... tenzij de plaats van de tekst vast staat.
  assert.match(met({ tekstPlaats: 'links' }), />A1</);
  // Zonder adres: de kring, en met beletteren/nummeren uit enkel de rest.
  const zonder = { item: { ...it, adres: '' }, code: 'A1' };
  const m2 = (opties) => plaatsingSvg(zonder, pl, 1, false, it.id, { plan: { ...plan, ...opties }, anderen: [] });
  assert.match(m2({}), />A1</);
  assert.match(m2({ nummeren: false }), />A</);
  assert.doesNotMatch(m2({ beletteren: false, nummeren: false }), /plan-code/);
  assert.doesNotMatch(plaatsingSvg(zonder, { ...pl, tekstPlaats: 'verbergen' }, 1, false, it.id, { plan, anderen: [] }), /plan-code/);
});

test('een input toont de kring van de output met hetzelfde adres', () => {
  const p = nieuwProject();
  const knop = nieuwItem('drukknop', { adres: 'K.01', functie: 'input' });
  const lamp = nieuwItem('lichtpunt', { adres: 'K.01', functie: 'output' });
  p.kinderen.push(nieuweKring({ items: [knop] }), nieuweKring({ items: [lamp] }));
  const r = tekenEendraad(p);
  assert.match(r.inhoud, /K\.01 → B1/);
});

test('een nieuwe pagina op een kring geeft een rode lijn en een eigen snijpunt', () => {
  const p = nieuwProject();
  p.kinderen.push(nieuweKring(), nieuweKring({ nieuwePagina: true }), nieuweKring());
  const r = tekenEendraad(p);
  assert.equal(r.kolommen.filter((c) => c.nieuw).length, 1);
  assert.match(r.inhoud, /paginalijn/);
});

test('een DXF wordt gelezen met lagen en eenheden en als SVG getekend', () => {
  const lijn = (x1, y1, x2, y2, l) => `0\nLINE\n8\n${l}\n10\n${x1}\n20\n${y1}\n11\n${x2}\n21\n${y2}\n`;
  const tekst = `0\nSECTION\n2\nHEADER\n9\n$INSUNITS\n70\n4\n0\nENDSEC\n0\nSECTION\n2\nENTITIES\n${lijn(0, 0, 4000, 0, 'MUREN')}${lijn(0, 0, 0, 3000, 'MUREN')}0\nCIRCLE\n8\nMEUBELS\n10\n1000\n20\n1000\n40\n300\n0\nENDSEC\n0\nEOF\n`;
  const d = leesDxf(tekst);
  assert.equal(d.metersPerEenheid, 0.001);
  assert.deepEqual(d.lagen.map((l) => l.naam).sort(), ['MEUBELS', 'MUREN']);
  const alles = dxfNaarSvg(d, { f: 0.1 });
  assert.equal(alles.breedte, 400);
  assert.equal(alles.hoogte, 300);
  const enkelMuren = dxfNaarSvg(d, { zichtbaar: new Set(['MUREN']), f: 0.1 });
  assert.doesNotMatch(enkelMuren.svg, /<circle/);
  assert.match(alles.svg, /<circle/);
  assert.throws(() => leesDxf('geen dxf'), /geen DXF/);
});

test('oudere projecten krijgen de nieuwe plan-opties', () => {
  const oud = JSON.parse(teBewaren(nieuwProject()));
  delete oud.plannen[0].beletteren;
  delete oud.opties;
  const p = leesProject(JSON.stringify(oud));
  assert.equal(p.plannen[0].beletteren, true);
  assert.equal(p.plannen[0].toonGrid, true);
  assert.equal(p.opties.losseSymbolen, true);
  assert.ok(p.plannen[0].muren.every((m) => m.id));
});

test('losse symbolen toewijzen: een schakelaar komt met zijn lampen op één rij', async () => {
  const { wijsToe } = await import('../app/js/model.js');
  const p = nieuwProject();
  const k = nieuweKring();
  p.kinderen.push(k);
  const sch = nieuwItem('schakelaar');
  const l1 = nieuwItem('lichtpunt');
  const l2 = nieuwItem('lichtpunt');
  const sc = nieuwItem('stopcontact');
  const plan = p.plannen[0];
  for (const it of [l1, sc, sch, l2]) plan.plaatsingen[it.id] = { x: 0, y: 0, rot: 0, los: true, item: it };
  plan.verbindingen.push({ id: 'v1', van: sch.id, naar: l1.id }, { id: 'v2', van: sch.id, naar: l2.id });
  assert.equal(wijsToe(p, [l1.id, sc.id, sch.id, l2.id], k.id), 4);
  assert.deepEqual(k.items.map((i) => i.soort), ['schakelaar', 'lichtpunt', 'lichtpunt', 'stopcontact']);
  assert.equal(losseSymbolen(p).length, 0);
});
